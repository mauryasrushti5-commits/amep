# Quick Reference: Confidence Score Implementation

## What Was Done

Implemented **deterministic, explainable confidence scoring** for AMEP students based on:
- **Accuracy** (correct vs incorrect answers)
- **Response time** (how fast they answer relative to difficulty)

Formula: `confidence = 0.7 × accuracyScore + 0.3 × speedScore`

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/utils/confidence.js` | Core scoring logic | ✅ NEW |
| `src/controllers/learning.controller.js` | Compute score on attempt | ✅ MODIFIED |
| `src/controllers/diagnostic.controller.js` | Set baseline confidence | ✅ MODIFIED |
| `src/models/StudyActivity.js` | Track expectedSeconds | ✅ MODIFIED |

---

## What Happens On Each Request

### `/learning/submit-attempt` (POST)
1. Student submits answer + response time
2. Log StudyActivity with: accuracy (0/1), responseTime, expectedSeconds
3. Fetch last 20 activities for that subject
4. Compute confidence using accuracy + speed
5. Update MasteryProfile.confidenceScore
6. Return response with `confidenceBreakdown`

### `/diagnostic/subject` (POST) - Initial Assessment
1. Student completes diagnostic
2. Calculate baseline: `confidenceScore = percentage / 100`
3. Save to MasteryProfile
4. Later attempts refine this score

---

## Example Response

```json
{
  "success": true,
  "feedback": "Good reasoning. Keep going.",
  "masteryPercentage": 65,
  "confidenceScore": 0.78,
  "confidenceBreakdown": {
    "accuracyScore": 0.80,     // 8 out of 10 correct
    "speedScore": 0.75,         // Median speed score
    "attemptsUsed": 10          // Based on 10 recent attempts
  }
}
```

---

## How Scoring Works

### Step 1: Calculate Accuracy
```
accuracyScore = number of correct answers / total attempts
Example: 8 correct out of 10 = 0.80
```

### Step 2: Calculate Speed for Each Attempt
```
For each attempt: speedAttempt = clamp01(expectedSeconds / responseTime)
Example: Expected 70s, took 50s → 70/50 = 1.4 → clamped to 1.0
Example: Expected 70s, took 100s → 70/100 = 0.7
```

### Step 3: Calculate Median Speed
```
speedScore = median(all speedAttempts)
Robust against outliers: one very slow attempt doesn't tank the score
```

### Step 4: Combine Weights
```
confidence = 0.7 × accuracyScore + 0.3 × speedScore
Accuracy matters most (70%), speed refines it (30%)
```

---

## Expected Response Times

Based on difficulty level:

| Difficulty | Expected Time | Use In |
|-----------|--------------|--------|
| Easy      | 40 seconds   | `expectedSeconds` |
| Medium    | 70 seconds   | `expectedSeconds` |
| Hard      | 110 seconds  | `expectedSeconds` |

These are set when activity is logged in `StudyActivity`.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| responseTime = 0 | Uses expectedSeconds (neutral) |
| responseTime > 5×expected | Clamped to 0, doesn't go negative |
| No activities yet | Returns default 0.5 |
| < 5 activities | Uses what's available |
| NaN or Infinity | Safely clamped to [0,1] |

---

## Testing

Run the test suite:
```bash
cd d:\OneDrive\Desktop\AmepProject
node TEST_CONFIDENCE.js
```

Shows 5 test cases with expected confidence values for different scenarios.

---

## No Changes To

✓ User authentication (JWT)  
✓ User model  
✓ Learning session orchestration  
✓ Gemini AI integration  
✓ Other controllers & routes  

---

## Documentation Files

| File | What's Inside |
|------|---------------|
| `CONFIDENCE_IMPLEMENTATION.md` | Detailed technical spec |
| `INTEGRATION_GUIDE.md` | How to integrate & deploy |
| `CODE_CHANGES.md` | Before/after code snippets |
| `TEST_CONFIDENCE.js` | Test suite with 5 cases |
| `IMPLEMENTATION_VERIFICATION_CHECKLIST.md` | Full checklist ✅ |

---

## Debugging Tips

If confidence seems wrong, check `confidenceBreakdown`:

```javascript
{
  "confidenceScore": 0.78,
  "confidenceBreakdown": {
    "accuracyScore": 0.80,      // ← Is this right? (8/10 correct?)
    "speedScore": 0.75,         // ← Are speeds reasonable?
    "attemptsUsed": 10          // ← Enough data? (< 5 = bootstrap phase)
  }
}
```

---

## One-Minute Test

Given 10 attempts on Math (medium difficulty = 70s expected):
- **Accuracy:** 8 correct, 2 incorrect → 0.80
- **Speed:** Response times [60, 65, 70, 75, 80, 90, 100, 110, 120, 130]
- **Speed attempts:** [1.17→1, 1.08→1, 1.0, 0.93, 0.88, 0.78, 0.70, 0.64, 0.58, 0.54]
- **Speed score:** Median = 0.825 → 0.83
- **Confidence = 0.7 × 0.80 + 0.3 × 0.83 = 0.56 + 0.25 = 0.81**

✅ All working correctly!

---

## Status: ✅ READY FOR DEPLOYMENT

- [x] All code written & tested
- [x] No breaking changes
- [x] Edge cases handled
- [x] Documentation complete
- [x] Test suite passes
- [x] Backward compatible

Deploy `src/utils/`, `src/controllers/`, `src/models/` changes and you're live!
