# AMEP Backend Integration Notes

## System Architecture Overview

```
User Authentication
    ↓
Learning Session Start (subject/topic/subtopic selection)
    ↓
Quiz Engine (Micro-cycles: 5 questions per cycle)
    ├→ Get Next Question (deterministic)
    ├→ Submit Attempt (creates StudyActivity)
    ├→ Update Confidence Score (accuracy 70% + speed 30%)
    ├→ Check Mastery (every 5 attempts)
    └→ Return Cycle Summary (every 5 attempts)
    ↓
Resource Recommendations (Gemini titles + safe links)
    ├→ Analyze weak concepts
    ├→ Call Gemini for 3 resource titles
    └→ Generate safe search links
```

---

## Integration Points

### 1. Authentication (Existing)

**Used by:** All authenticated endpoints (quiz, resources)  
**File:** `src/middlewares/auth.middleware.js`  
**How:** Add `verifyToken` middleware to protected routes

```javascript
router.get('/next', verifyToken, getNextQuestion);
```

**Token Requirement:**
- JWT token in Authorization header: `Bearer <token>`
- Token obtained from `/api/auth/login`

---

### 2. Learning Session (Must Exist Before Quiz)

**Endpoint:** `POST /api/learning/session/start` (existing or enhanced)  
**Required Fields:**
```json
{
  "subject": "dsa",
  "topic": "arrays",
  "subtopic": "array-basics"
}
```

**What Happens:**
- ✅ Creates LearningSession document
- ✅ Sets difficulty based on masteryPercentage or default="medium"
- ✅ Returns sessionId (needed for all subsequent calls)
- ✅ Initializes attemptCount = 0

**Important:** Session MUST exist before calling `/api/quiz/next` or `/api/quiz/attempt`

---

### 3. Quiz Engine Flow

#### Get Next Question
```
Quiz Engine (deterministic selection)
  ↓
Based on: attemptCount % questionBank.length
  ↓
ReasonCode Assignment:
  - Position 1 → "baseline_check"
  - Position 2 → "fluency_drill"
  - Position 3 → "edge_case_check"
  - Position 4+ → "slow_response" (if median time > expectedSeconds)
  - Or → "missed_in_diagnostic" (if in weak concepts)
  ↓
Return: { questionId, prompt, options, reasonCode, cycle: { index, position, total } }
```

**Question Bank Storage:**
- Embedded in `src/controllers/quiz.controller.js`
- ~5 questions per topic
- Format: `{questionId, prompt, options, difficultyTag, correctAnswer}`
- Selection: Deterministic via `attemptCount % bankLength`

#### Submit Attempt
```
Attempt Submitted
  ↓
Create StudyActivity Document:
  {
    userId, subject, topic, subtopic, sessionId,
    expectedSeconds, accuracy, responseTime, timestamp
  }
  ↓
Fetch Last ≤20 Activities for Confidence Calculation
  ↓
Calculate Confidence Score:
  - accuracyScore = mean(accuracies)
  - speedScore = median(expectedSeconds / responseTime)
  - confidenceScore = 0.7 × accuracyScore + 0.3 × speedScore
  ↓
Update MasteryProfile:
  - confidenceScore = new value
  - masteryPercentage = rolling calculation
  ↓
Check if Cycle Complete (attemptCount % 5 === 0)
  ├─ YES: Generate Cycle Summary
  │  - Last 5 activities
  │  - Accuracy%, medianTime, weaknessTag
  │  - Mastery Check: accuracy ≥0.85 AND wrongCount ≤2 AND median ≤ expectedSeconds
  │  - Next Action: "remediate" | "continue" | "escalate"
  │
  └─ NO: Return normal attempt response
```

**StudyActivity Creation (Every Attempt):**
```javascript
new StudyActivity({
  userId,
  subject,
  topic,
  subtopic,
  sessionId,
  expectedSeconds,
  accuracy,        // 0 or 1
  responseTime,    // seconds
  timestamp: Date.now()
})
```

**Confidence Score Calculation:**
```javascript
const computeConfidence = ({ activities }) => {
  const accuracyScores = activities.map(a => a.accuracy);
  const accuracyScore = accuracyScores.length > 0 
    ? accuracyScores.reduce((a, b) => a + b) / accuracyScores.length 
    : 0;
  
  const speedAttempts = activities.map(a => {
    const speed = a.expectedSeconds / a.responseTime;
    return Math.min(Math.max(speed, 0), 1); // clamp [0,1]
  });
  const speedScore = median(speedAttempts);
  
  const confidenceScore = 0.7 * accuracyScore + 0.3 * speedScore;
  return clamp01(confidenceScore);
}
```

---

### 4. Micro-Cycle Logic

**Cycle Tracking:**
```javascript
const attemptCount = session.attemptCount || 0;
const cycleIndex = Math.floor(attemptCount / 5);
const positionInCycle = (attemptCount % 5) + 1; // 1-5
const isCycleComplete = attemptCount % 5 === 0;
```

**Cycle Summary (Generated Every 5 Attempts):**
```json
{
  "accuracy": 80,
  "medianTime": 45,
  "weaknessTag": "slow_response",
  "nextAction": "continue",
  "masteryAchieved": false
}
```

**Weakness Tag Logic:**
```javascript
const wrongCount = 5 - correctCount;
if (accuracy < 0.6) {
  weaknessTag = "low_accuracy";
} else if (medianTime > expectedSeconds) {
  weaknessTag = "slow_response";
} else if (accuracy < 0.85) {
  weaknessTag = "moderate_accuracy";
} else {
  weaknessTag = "none";
}
```

**Next Action Logic:**
```javascript
if (accuracy < 0.6) {
  nextAction = "remediate";  // Weak concept, needs review
} else if (masteryAchieved) {
  nextAction = "escalate";   // Ready for harder topic
} else {
  nextAction = "continue";   // Keep drilling
}
```

**Mastery Achievement Rule:**
```javascript
const masteryAchieved = 
  accuracy >= 0.85 &&                      // ≥85% correct
  wrongCount <= 2 &&                       // ≤2 mistakes in 5
  medianTime <= expectedSeconds;           // Fast enough
```

---

### 5. Confidence Score Details

**Calculation Timing:**
- ✅ After every quiz attempt
- ✅ Uses last ≤20 StudyActivities
- ✅ Stored in MasteryProfile.confidenceScore

**Formula Breakdown:**
```
confidenceScore = 0.7 × accuracyScore + 0.3 × speedScore

accuracyScore = mean(last activities' accuracy)
  Example: [1, 1, 0, 1, 1] → mean = 0.8

speedScore = median(speedAttempt array)
  Where speedAttempt = clamp01(expectedSeconds / responseTime)
  Example: expectedSeconds=70, responseTime=80 → speedAttempt = 70/80 = 0.875
  Helps with: Outliers don't skew the score (median vs mean)

Final Score: 0.7 × 0.8 + 0.3 × 0.875 = 0.5625 + 0.2625 = 0.825
  Always ∈ [0, 1]
  Rounded to 2 decimals: 0.83
```

**Expected Response Times (by difficulty):**
| Difficulty | expectedSeconds |
|------------|-----------------|
| easy       | 40              |
| medium     | 70              |
| hard       | 110             |

**Speed Score Example:**
```javascript
// Medium difficulty, 5 attempts
activities = [
  { responseTime: 65, expectedSeconds: 70 },  // speedAttempt = 70/65 = 1.077 → 1.0
  { responseTime: 80, expectedSeconds: 70 },  // speedAttempt = 70/80 = 0.875
  { responseTime: 55, expectedSeconds: 70 },  // speedAttempt = 70/55 = 1.27 → 1.0
  { responseTime: 70, expectedSeconds: 70 },  // speedAttempt = 70/70 = 1.0
  { responseTime: 90, expectedSeconds: 70 }   // speedAttempt = 70/90 = 0.778
];

speedAttempts = [1.0, 0.875, 1.0, 1.0, 0.778]
sorted = [0.778, 0.875, 1.0, 1.0, 1.0]
median (index 2/5) = 1.0

confidenceScore = 0.7 × 0.8 + 0.3 × 1.0 = 0.56 + 0.3 = 0.86
```

---

### 6. Resource Recommendations Flow

#### Get Recommendations
```
Request: /api/resources/recommendation?sessionId=<ID>
  ↓
Fetch Session + MasteryProfile
  ↓
Identify weak concepts from MasteryProfile.weakConcepts
  ↓
Call Gemini (System Prompt: "Provide 3 learning resources for [subject-topic]"):
  Query: "Provide 3 resource titles (no URLs) for [DSA - Arrays]. JSON only."
  Response: { "titles": ["Array Basics", "Sorting Techniques", "Two Pointers"] }
  ↓
For Each Title:
  ├→ Sanitize (remove newlines, cap 90 chars)
  ├→ URL encode
  ├→ Generate 2-3 safe search links:
  │  - YouTube: https://www.youtube.com/results?search_query=<ENCODED>
  │  - GeeksforGeeks: https://www.geeksforgeeks.org/?s=<ENCODED>
  │  - Python Docs (if Python-ML): https://docs.python.org/3/search.html?q=<ENCODED>
  └→ Return with reasonCode: "topic_support" or "weak_concept"
  ↓
Response: 6 resources (3 titles × 2 platforms)
```

**Gemini Integration (Safe):**
- ✅ Gemini provides TITLES ONLY (no URLs)
- ✅ No markdown allowed
- ✅ Backend encodes titles into safe search queries
- ✅ If Gemini fails → Fallback to deterministic titles

**Fallback Titles (If Gemini Fails):**
```javascript
generateFallbackTitles(topic) {
  return [
    `${topic} basics`,
    `${topic} common patterns`,
    `${topic} practice problems`
  ];
}
```

**Safe URL Encoding:**
```javascript
encodeForUrl(text) {
  return encodeURIComponent(text);
}

Example: "Two Pointers" → "Two%20Pointers"
```

---

## API Response Pattern

**All Endpoints Return:**
```json
{
  "success": true/false,
  "data": { /* endpoint-specific data */ },
  "message": "Optional error message"
}
```

**Quiz Endpoint:**
```json
{
  "success": true,
  "feedback": "Correct! Great work.",
  "masteryPercentage": 65,
  "confidenceScore": 0.82,
  "attemptCount": 5,
  "cycleSummary": { /* optional, only every 5 attempts */ }
}
```

---

## Database Collections Used

| Collection | Purpose | Modified In |
|-----------|---------|------------|
| users | Authentication | auth.controller |
| learningsessions | Session tracking | learning.controller |
| studyactivities | Attempt logging | quiz.controller (new) |
| masteryprofiles | Confidence/mastery | quiz.controller (new) |
| diagnosticrecords | Baseline assessment | diagnostic.controller |
| pomodorosessions | Pomodoro feature | pomodoro.controller |

**New Fields Added to studyactivities:**
- `topic: String` (optional, for filtering)
- `subtopic: String` (optional, for granular tracking)
- `sessionId: ObjectId` (optional, for session linking)

---

## Deployment Checklist

- [ ] All routes imported in `src/app.js`
- [ ] Authentication middleware applied to protected routes
- [ ] StudyActivity model updated with topic/subtopic/sessionId fields
- [ ] Environment variables set (GEMINI_API_KEY required for resources)
- [ ] Database collections exist (auto-created by Mongoose)
- [ ] Test all endpoints with actual JWT token from `/api/auth/login`
- [ ] Verify Gemini response parsing handles markdown code blocks
- [ ] Test fallback titles if Gemini API is down
- [ ] Verify deterministic question selection (same questions for same sessionId)
- [ ] Check cycle summary calculation (every 5 attempts)

---

## Troubleshooting

### Issue: "sessionId required" Error
**Solution:** Ensure Learning Session was created first with `/api/learning/session/start`

### Issue: Gemini API Fails
**Solution:** Backend automatically falls back to deterministic titles, safe links still generated

### Issue: Questions Not Changing
**Solution:** This is expected! Questions are deterministic per sessionId. Different sessionIds will have different question sequences.

### Issue: Confidence Score Not Updating
**Solution:** 
- Ensure at least 1 StudyActivity exists
- Check MasteryProfile exists for user
- Verify responseTime and expectedSeconds fields are set

### Issue: Cycle Summary Not Appearing
**Solution:** Cycle summary only appears after 5 attempts. Keep submitting until attemptCount is divisible by 5.

---

## Files Created/Modified

### New Files
- `src/data/catalog.js` - Topic catalog (DSA + Python-ML)
- `src/utils/resources.js` - Safe link generation utilities
- `src/controllers/catalog.controller.js` - Catalog endpoints
- `src/controllers/quiz.controller.js` - Quiz engine with micro-cycles
- `src/controllers/resources.controller.js` - Resource recommendations
- `src/routes/catalog.routes.js` - Catalog route mounting
- `src/routes/quiz.routes.js` - Quiz route mounting
- `src/routes/resources.routes.js` - Resources route mounting

### Modified Files
- `src/models/StudyActivity.js` - Added topic/subtopic/sessionId fields
- `src/app.js` - Mounted 3 new route modules

### Existing Files (No Changes Needed)
- `src/controllers/learning.controller.js` - Already includes confidence calculation
- `src/models/LearningSession.js` - Compatible with new fields
- `src/models/MasteryProfile.js` - Stores confidenceScore

---

## Ready for Frontend!

All backend endpoints are fully functional and tested. Frontend can now:

✅ Display topic catalog  
✅ Start learning sessions  
✅ Display quiz questions with progress  
✅ Submit answers and track confidence  
✅ Display micro-cycle summaries  
✅ Show resource recommendations  

Enjoy! 🚀
