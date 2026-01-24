# AMEP Backend Testing Checklist

## Pre-Testing Setup

- [ ] Node.js server running: `npm start` in `src/`
- [ ] MongoDB connected and running
- [ ] Environment variables set (especially `GEMINI_API_KEY`)
- [ ] Have a valid JWT token from `/api/auth/login`

---

## Phase 1: Catalog Endpoints (No Auth Required)

### Test 1.1: GET /api/catalog/subjects
**Expected:** List all 2 subjects (DSA, Python-ML)
```bash
curl http://localhost:5000/api/catalog/subjects
```
- [ ] Status: 200
- [ ] Data contains "dsa" and "python-ml"
- [ ] Each subject has topicCount

### Test 1.2: GET /api/catalog/topics
**Expected:** List 10 topics for DSA
```bash
curl "http://localhost:5000/api/catalog/topics?subject=dsa"
```
- [ ] Status: 200
- [ ] 10 topics returned: Arrays, Strings, Linked Lists, etc.
- [ ] Each topic has subtopicCount

### Test 1.3: GET /api/catalog/topics (Python-ML)
**Expected:** List 10 topics for Python-ML
```bash
curl "http://localhost:5000/api/catalog/topics?subject=python-ml"
```
- [ ] Status: 200
- [ ] 10 topics returned: Basics, NumPy, Pandas, etc.

### Test 1.4: GET /api/catalog/subtopics
**Expected:** List 6 subtopics for Arrays
```bash
curl "http://localhost:5000/api/catalog/subtopics?subject=dsa&topic=arrays"
```
- [ ] Status: 200
- [ ] Returns array-basics, array-manipulation, searching, sorting, two-pointers, sliding-window

### Test 1.5: GET /api/catalog/validate
**Expected:** Validate valid path
```bash
curl "http://localhost:5000/api/catalog/validate?subject=dsa&topic=arrays&subtopic=array-basics"
```
- [ ] Status: 200
- [ ] valid: true
- [ ] Returns full subject, topic, subtopic objects

### Test 1.6: GET /api/catalog/validate (Invalid)
**Expected:** Reject invalid path
```bash
curl "http://localhost:5000/api/catalog/validate?subject=dsa&topic=invalid"
```
- [ ] Status: 400
- [ ] success: false

---

## Phase 2: Learning Session (Auth Required)

### Test 2.1: POST /api/learning/session/start
**Expected:** Create new session and return sessionId
```bash
curl -X POST http://localhost:5000/api/learning/session/start \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "dsa",
    "topic": "arrays",
    "subtopic": "array-basics"
  }'
```
- [ ] Status: 200
- [ ] Returns session with _id (save this as SESSION_ID)
- [ ] session.subject = "dsa"
- [ ] session.topic = "arrays"
- [ ] session.subtopic = "array-basics"
- [ ] session.difficulty = "medium" (or based on user's mastery)
- [ ] session.attemptCount = 0
- [ ] session.status = "active"

---

## Phase 3: Quiz Engine (Auth Required)

### Test 3.1: GET /api/quiz/next (1st Question)
**Expected:** Return first question with baseline_check reasonCode
```bash
curl "http://localhost:5000/api/quiz/next?sessionId=<SESSION_ID>" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```
- [ ] Status: 200
- [ ] Returns question with questionId, prompt, options
- [ ] reasonCode = "baseline_check"
- [ ] cycle.position = 1, cycle.total = 5

### Test 3.2: POST /api/quiz/attempt (1st Attempt - Correct)
**Expected:** Record attempt and return confidence update
```bash
curl -X POST http://localhost:5000/api/quiz/attempt \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "<SESSION_ID>",
    "questionId": "dsa-arr-1",
    "isCorrect": true,
    "responseTime": 35
  }'
```
- [ ] Status: 200
- [ ] success: true
- [ ] feedback: "Correct! Great work."
- [ ] masteryPercentage: number (0-100)
- [ ] confidenceScore: number (0-1)
- [ ] attemptCount: 1
- [ ] NO cycleSummary (only after 5 attempts)

### Test 3.3: GET /api/quiz/next (2nd Question)
**Expected:** Return second question with fluency_drill reasonCode
```bash
curl "http://localhost:5000/api/quiz/next?sessionId=<SESSION_ID>" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```
- [ ] Status: 200
- [ ] questionId different from first question (if bank has ≥2 questions)
- [ ] reasonCode = "fluency_drill"
- [ ] cycle.position = 2

### Test 3.4: POST /api/quiz/attempt (2nd Attempt - Incorrect)
**Expected:** Record incorrect attempt
```bash
curl -X POST http://localhost:5000/api/quiz/attempt \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "<SESSION_ID>",
    "questionId": "dsa-arr-2",
    "isCorrect": false,
    "responseTime": 120
  }'
```
- [ ] Status: 200
- [ ] feedback includes correction
- [ ] confidenceScore: lower than before (due to wrong answer)
- [ ] attemptCount: 2

### Test 3.5: Continue Until Cycle Complete (Attempts 3-5)
**Expected:** After 5 total attempts, receive cycleSummary
```bash
# Repeat Tests 3.3 and 3.4 for attempts 3, 4, 5
# On the 5th attempt POST, expect cycleSummary
```
- [ ] Attempts 3-4: No cycleSummary (attemptCount 3-4)
- [ ] Attempt 5: cycleSummary appears (attemptCount 5)

### Test 3.6: Cycle Summary Structure (5th Attempt)
**Expected:** Receive detailed cycle analysis
```json
{
  "success": true,
  "cycleSummary": {
    "accuracy": 80,                    // 4/5 correct
    "medianTime": 50,                  // median of [35, 120, 40, 45, 38]
    "weaknessTag": "slow_response",    // or "none", "low_accuracy", "moderate_accuracy"
    "nextAction": "continue",          // or "remediate", "escalate"
    "masteryAchieved": false
  },
  "progressSnapshot": {
    "masteryPercentage": 75,
    "confidenceScore": 0.78
  }
}
```
- [ ] accuracy: 80% (4 correct out of 5)
- [ ] medianTime: calculated from 5 response times
- [ ] weaknessTag: reflects performance (speed or accuracy)
- [ ] nextAction: appropriate for performance level
- [ ] masteryAchieved: true only if accuracy ≥0.85 AND wrongCount ≤2 AND medianTime ≤ expectedSeconds

### Test 3.7: Deterministic Question Ordering
**Expected:** Starting new session with same subject/topic gets same question sequence
```bash
# Create new session with same subject/topic
curl -X POST http://localhost:5000/api/learning/session/start \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"subject": "dsa", "topic": "arrays", "subtopic": "array-basics"}'

# Get 1st question from new session
curl "http://localhost:5000/api/quiz/next?sessionId=<NEW_SESSION_ID>" \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Get 1st question from old session (if still active)
curl "http://localhost:5000/api/quiz/next?sessionId=<OLD_SESSION_ID>" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```
- [ ] Both return same questionId for position 1
- [ ] This confirms deterministic selection is working

---

## Phase 4: Confidence Score Calculation

### Test 4.1: Accuracy Score Component
**Expected:** Confidence increases with correct answers
```
After 5 attempts with 4 correct, 1 incorrect:
  accuracyScore = 4/5 = 0.8
```
- [ ] Submit 5 answers with 4 correct, 1 incorrect
- [ ] Verify confidenceScore reflects ~0.8 accuracy component

### Test 4.2: Speed Score Component
**Expected:** Confidence increases with faster answers
```
Speed formula: speedAttempt = clamp01(expectedSeconds / responseTime)
For medium difficulty (expectedSeconds=70):
  - responseTime 35 → speedAttempt = 70/35 = 2.0 → clamp to 1.0
  - responseTime 70 → speedAttempt = 70/70 = 1.0
  - responseTime 140 → speedAttempt = 70/140 = 0.5
```
- [ ] Submit fast responses (e.g., 35s for medium)
- [ ] Verify speedScore component increases
- [ ] Verify overall confidenceScore = 0.7×accuracy + 0.3×speed

### Test 4.3: Confidence Score Range
**Expected:** Always returns value in [0, 1]
```bash
# Submit mix of correct/incorrect, fast/slow answers
# Check response after each attempt
```
- [ ] confidenceScore never > 1.0
- [ ] confidenceScore never < 0.0
- [ ] Rounded to 2 decimal places (e.g., 0.82, not 0.8234)

---

## Phase 5: Resource Recommendations (Auth Required)

### Test 5.1: GET /api/resources/recommendation
**Expected:** Return 6 resources (3 titles × 2 platforms)
```bash
curl "http://localhost:5000/api/resources/recommendation?sessionId=<SESSION_ID>" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```
- [ ] Status: 200
- [ ] resources array contains 6 items
- [ ] Each resource has: label, title, url, reasonCode
- [ ] Labels include: "YouTube", "GeeksforGeeks"
- [ ] URLs are properly encoded search queries (contain %20, no spaces)

### Test 5.2: Resource URL Format
**Expected:** Safe search query URLs
```
YouTube: https://www.youtube.com/results?search_query=<ENCODED>
GeeksforGeeks: https://www.geeksforgeeks.org/?s=<ENCODED>
```
- [ ] YouTube URLs contain `/results?search_query=`
- [ ] GeeksforGeeks URLs contain `?s=`
- [ ] No hardcoded video/article IDs (only search queries)
- [ ] All special characters properly encoded (%20 for spaces)

### Test 5.3: Python-ML Resources
**Expected:** For Python-ML topics, include Python Docs link
```bash
# Start session with Python-ML subject
curl -X POST http://localhost:5000/api/learning/session/start \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "subject": "python-ml",
    "topic": "numpy",
    "subtopic": "arrays"
  }'

# Get resources
curl "http://localhost:5000/api/resources/recommendation?sessionId=<SESSION_ID>" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```
- [ ] Resources include Python Docs link
- [ ] Format: `https://docs.python.org/3/search.html?q=<ENCODED>`

### Test 5.4: ReasonCode
**Expected:** Indicates why resource is recommended
```
reasonCode values:
  - "topic_support": General topic support
  - "weak_concept": Resource for identified weak concept
```
- [ ] reasonCode set appropriately
- [ ] All 6 resources have a reasonCode

### Test 5.5: Gemini Fallback (Optional)
**Expected:** If Gemini fails, fallback titles are used
```bash
# (Requires intentionally breaking Gemini call to test)
# Expected fallback titles:
#   - "array basics"
#   - "array common patterns"
#   - "array practice problems"
```
- [ ] If GEMINI_API_KEY invalid or API down
- [ ] Resources still returned with fallback titles
- [ ] URLs still generated correctly

### Test 5.6: POST /api/resources/feedback (Optional)
**Expected:** Record resource feedback
```bash
curl -X POST http://localhost:5000/api/resources/feedback \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceLabel": "YouTube",
    "resourceTitle": "Array basics",
    "helpful": true
  }'
```
- [ ] Status: 200
- [ ] success: true

---

## Phase 6: Error Handling

### Test 6.1: Missing sessionId
**Expected:** 400 Bad Request
```bash
curl "http://localhost:5000/api/quiz/next" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```
- [ ] Status: 400
- [ ] Message: "sessionId required"

### Test 6.2: Invalid Auth Token
**Expected:** 403 Forbidden
```bash
curl "http://localhost:5000/api/quiz/next?sessionId=<SESSION_ID>" \
  -H "Authorization: Bearer invalid_token"
```
- [ ] Status: 403
- [ ] Message: "Unauthorized" or similar

### Test 6.3: Missing Auth Header
**Expected:** 403 Forbidden
```bash
curl "http://localhost:5000/api/quiz/next?sessionId=<SESSION_ID>"
```
- [ ] Status: 403
- [ ] Message: "No token provided" or similar

### Test 6.4: Invalid Subject
**Expected:** 400 Bad Request
```bash
curl "http://localhost:5000/api/catalog/topics?subject=invalid"
```
- [ ] Status: 400
- [ ] success: false

---

## Phase 7: Data Consistency

### Test 7.1: StudyActivity Created on Every Attempt
**Expected:** Database records every attempt
```bash
# Make 5 quiz attempts, then query database:
# db.studyactivities.find({sessionId: <SESSION_ID>})
```
- [ ] Exactly 5 documents created
- [ ] Each has: userId, subject, topic, subtopic, sessionId, expectedSeconds, accuracy, responseTime, timestamp
- [ ] All fields populated correctly

### Test 7.2: MasteryProfile Updated
**Expected:** confidenceScore updates after each attempt
```bash
# db.masteryprofiles.findOne({userId: <USER_ID>, subject: "dsa"})
```
- [ ] confidenceScore exists and is number [0,1]
- [ ] Updates after each new attempt
- [ ] Matches confidenceScore returned by /api/quiz/attempt

### Test 7.3: LearningSession Updated
**Expected:** attemptCount increases
```bash
# db.learningsessions.findById(<SESSION_ID>)
# Verify before and after quiz attempts
```
- [ ] attemptCount = 0 initially
- [ ] Increases to 1, 2, 3, ... 5 after each attempt
- [ ] Must manually increment in quiz.controller or fetch latest session

---

## Stress Testing (Optional)

### Test 8.1: Multiple Sessions
**Expected:** Can manage multiple concurrent sessions
```bash
# Create 3 sessions for same user, different topics
# Make attempts in all 3 simultaneously
# Verify each tracks independently
```
- [ ] Each session has unique sessionId
- [ ] attemptCounts don't interfere
- [ ] Different topic questions for each

### Test 8.2: Large Response Times
**Expected:** Speed score handles extreme values
```bash
# Submit attempt with responseTime = 500s (much slower than expected)
# speedAttempt = clamp01(70/500) = clamp01(0.14) = 0.14
```
- [ ] No errors or crashes
- [ ] speedScore adjusted accordingly
- [ ] confidenceScore still [0,1]

---

## Final Checklist

- [ ] All Catalog endpoints working (Phase 1)
- [ ] Session creation working (Phase 2)
- [ ] Quiz flow working 5+ attempts (Phase 3)
- [ ] Cycle summary appears after 5 attempts (Phase 3)
- [ ] Confidence score calculation correct (Phase 4)
- [ ] Resource recommendations working (Phase 5)
- [ ] Error handling appropriate (Phase 6)
- [ ] Database consistency verified (Phase 7)
- [ ] No console errors or warnings
- [ ] Response times reasonable (<1s per endpoint)

---

## Quick Test Script

```bash
#!/bin/bash

# Save JWT token
TOKEN="Bearer <YOUR_JWT_TOKEN>"

# 1. Test catalog
echo "=== Testing Catalog ==="
curl http://localhost:5000/api/catalog/subjects

# 2. Create session
echo "=== Creating Session ==="
SESSION=$(curl -s -X POST http://localhost:5000/api/learning/session/start \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"dsa","topic":"arrays","subtopic":"array-basics"}' \
  | jq -r '.session._id')

echo "Session ID: $SESSION"

# 3. Get first question
echo "=== Getting First Question ==="
curl -s "http://localhost:5000/api/quiz/next?sessionId=$SESSION" \
  -H "Authorization: $TOKEN" | jq .

# 4. Submit attempt
echo "=== Submitting Attempt ==="
curl -s -X POST http://localhost:5000/api/quiz/attempt \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"questionId\":\"dsa-arr-1\",\"isCorrect\":true,\"responseTime\":35}" | jq .

# 5. Get resources
echo "=== Getting Resources ==="
curl -s "http://localhost:5000/api/resources/recommendation?sessionId=$SESSION" \
  -H "Authorization: $TOKEN" | jq .
```

---

## Notes

- Replace `<JWT_TOKEN>` with actual token from `/api/auth/login`
- Replace `<SESSION_ID>` with sessionId returned from `/api/learning/session/start`
- Questions returned are deterministic (same for same sessionId)
- Cycle summary only appears after every 5 attempts (not on 1st, 2nd, 3rd, 4th)
- Gemini integration optional for resources (fallback always works)

**Good luck! 🎯**
