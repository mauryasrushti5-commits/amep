## AMEP Confidence Score Implementation - Summary

### Goal Achieved
✅ Updated AMEP backend so a student's `confidenceScore` is calculated deterministically using:
1. **Accuracy** (correct vs incorrect answers)
2. **Response time** (how quickly they answered relative to expected time)

---

## Files Created & Modified

### 1. NEW FILE: [src/utils/confidence.js](src/utils/confidence.js)

**Exports:**
- `clamp01(x)` - Clamps any value to [0, 1], safely handles NaN/invalid inputs
- `median(arr)` - Calculates robust median (handles outliers better than mean)
- `computeConfidence({ activities })` - Main confidence calculation function

**Formula:**
```
confidenceScore = 0.7 × accuracyScore + 0.3 × speedScore

Where:
  accuracyScore = mean(accuracy) over last N activities
  speedScore = median(speedAttempt) over last N activities
  speedAttempt = clamp01(expectedSeconds / responseTime)
```

**Key Features:**
- Uses **median** for speed scores to be robust against outlier long responses
- Handles edge cases: responseTime ≤ 0, no activities, invalid data
- Returns breakdown: `{ confidence, accuracyScore, speedScore, attemptsUsed }`
- All outputs clamped to [0, 1] and rounded to 2 decimals
- **No Gemini/AI calls** – purely deterministic math

---

### 2. MODIFIED: [src/controllers/learning.controller.js](src/controllers/learning.controller.js)

**Changes in `submitAttempt()`:**

1. **Added import:**
   ```javascript
   import { computeConfidence } from "../utils/confidence.js";
   ```

2. **Calculate expectedSeconds based on difficulty:**
   ```javascript
   const expectedSeconds = session.difficulty === 'easy' ? 40 :
                          session.difficulty === 'medium' ? 70 : 110;
   ```

3. **Log StudyActivity with expectedSeconds:**
   ```javascript
   await StudyActivity.create({
     userId,
     subject: session.subject,
     expectedSeconds,
     accuracy: correct ? 1 : 0,
     responseTime: timeTaken || 0
   });
   ```

4. **Fetch last 20 activities (or fewer) and compute confidence:**
   ```javascript
   const recentActivities = await StudyActivity.find({
     userId,
     subject: session.subject
   })
   .sort({ timestamp: -1 })
   .limit(20)
   .select('accuracy responseTime expectedSeconds');

   const confidenceResult = computeConfidence({ activities: recentActivities });
   ```

5. **Update MasteryProfile with calculated confidence:**
   ```javascript
   masteryProfile.confidenceScore = confidenceResult.confidence;
   ```

6. **Return explainability breakdown:**
   ```javascript
   res.status(200).json({
     // ...
     confidenceScore: masteryProfile.confidenceScore,
     confidenceBreakdown: {
       accuracyScore: confidenceResult.accuracyScore,
       speedScore: confidenceResult.speedScore,
       attemptsUsed: confidenceResult.attemptsUsed
     }
   });
   ```

---

### 3. MODIFIED: [src/controllers/diagnostic.controller.js](src/controllers/diagnostic.controller.js)

**Changes in `subjectDiagnostic()`:**

1. **Added import:**
   ```javascript
   import { clamp01 } from "../utils/confidence.js";
   ```

2. **Baseline confidence using diagnostic percentage:**
   ```javascript
   const masteryProfile = await MasteryProfile.create({
     // ...
     confidenceScore: clamp01(percentage / 100)
   });
   ```

This ensures:
- Initial confidence is set safely (0–1 range)
- Later learning submissions refine this score using accumulated StudyActivity data
- Fallback: if < 5 activities exist, defaults to 0.5 (neutral) in computeConfidence

---

### 4. MODIFIED: [src/models/StudyActivity.js](src/models/StudyActivity.js)

**Added field:**
```javascript
expectedSeconds: {
  type: Number,
  required: true
}
```

This stores the expected response time for the difficulty level when the activity was logged, enabling fair speed comparisons across different question types.

---

## Example Calculation

**Scenario:** Student has 10 recent attempts on "Math" with medium difficulty (expectedSeconds = 70s)

```
Attempts:
[
  { accuracy: 1, responseTime: 50, expectedSeconds: 70 },   // speedAttempt = 70/50 = 1.4 → clamp → 1.0
  { accuracy: 1, responseTime: 65, expectedSeconds: 70 },   // speedAttempt = 70/65 = 1.08 → clamp → 1.0
  { accuracy: 0, responseTime: 90, expectedSeconds: 70 },   // speedAttempt = 70/90 = 0.78
  { accuracy: 1, responseTime: 100, expectedSeconds: 70 },  // speedAttempt = 70/100 = 0.7
  { accuracy: 1, responseTime: 75, expectedSeconds: 70 },   // speedAttempt = 70/75 = 0.93
  { accuracy: 0, responseTime: 120, expectedSeconds: 70 },  // speedAttempt = 70/120 = 0.58
  { accuracy: 1, responseTime: 55, expectedSeconds: 70 },   // speedAttempt = 70/55 = 1.27 → clamp → 1.0
  { accuracy: 1, responseTime: 70, expectedSeconds: 70 },   // speedAttempt = 70/70 = 1.0
  { accuracy: 0, responseTime: 110, expectedSeconds: 70 },  // speedAttempt = 70/110 = 0.64
  { accuracy: 1, responseTime: 60, expectedSeconds: 70 }    // speedAttempt = 70/60 = 1.17 → clamp → 1.0
]

Calculation:
  accuracyScore = (1+1+0+1+1+0+1+1+0+1) / 10 = 7/10 = 0.70
  
  speedAttempts = [1.0, 1.0, 0.78, 0.70, 0.93, 0.58, 1.0, 1.0, 0.64, 1.0]
  sorted = [0.58, 0.64, 0.70, 0.78, 0.93, 1.0, 1.0, 1.0, 1.0, 1.0]
  speedScore = median([...]) = (0.93 + 1.0) / 2 = 0.965 → rounds to 0.97
  
  confidence = 0.7 × 0.70 + 0.3 × 0.97
             = 0.49 + 0.291
             = 0.781 → rounds to 0.78
```

**Response includes:**
```json
{
  "success": true,
  "confidenceScore": 0.78,
  "confidenceBreakdown": {
    "accuracyScore": 0.70,
    "speedScore": 0.97,
    "attemptsUsed": 10
  }
}
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **70% accuracy, 30% speed** | Accuracy is primary; speed refines but doesn't dominate |
| **Median over mean** | Robust to outliers (e.g., one very slow attempt) |
| **Last 20 activities** | Balances recency & stability (not too noisy, not too stale) |
| **Store expectedSeconds in DB** | Enables fair comparison when difficulty/expectations change |
| **Clamp all values to [0,1]** | Prevents NaN/Infinity, ensures valid confidence metric |
| **No AI/Gemini** | Deterministic & explainable; no external API dependency |
| **Confidence breakdown in response** | Provides transparency for debugging & UX |

---

## Edge Cases Handled

✅ **responseTime ≤ 0:** Uses expectedSeconds (neutral score)  
✅ **Very large responseTime:** speedAttempt ≈ 0, but never negative  
✅ **No activities:** Falls back to diagnostic baseline (0.5 if no baseline)  
✅ **< 5 activities:** Uses available data; defaults to 0.5 on compute error  
✅ **Invalid/missing fields:** Filters out, uses valid records only  
✅ **NaN/Infinity:** clamp01() handles safely, returns 0.5  

---

## Testing Instruction

**Example test case:**
```javascript
// If last 10 attempts:
// - accuracy = 0.8 (8 correct, 2 incorrect)
// - speedAttempts = [0.9, 1.0, 0.8, 0.7, 0.95, 0.85, 0.75, 1.0, 0.6, 0.9]
// - speedScore (median) = 0.875 → rounds to 0.88

// Then: confidence = 0.7 × 0.8 + 0.3 × 0.88 = 0.56 + 0.264 = 0.824 → 0.82

// Expected response:
{
  "confidenceScore": 0.82,
  "confidenceBreakdown": {
    "accuracyScore": 0.80,
    "speedScore": 0.88,
    "attemptsUsed": 10
  }
}
```

---

## Summary

✅ **No breaking changes** – existing orchestration logic untouched  
✅ **Deterministic & explainable** – pure math, no randomness or external AI  
✅ **Stable metric** – uses median to reduce noise  
✅ **Normalized [0,1]** – with safeguards against NaN/Infinity  
✅ **Stored in MasteryProfile** – persisted for tracking progress  
✅ **Integrates seamlessly** – updates triggered on attempt submission & diagnostic creation  
✅ **JWT auth unchanged** – no security modifications  

The system is ready for testing and deployment!
