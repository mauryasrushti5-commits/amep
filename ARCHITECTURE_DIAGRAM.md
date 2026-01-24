# Confidence Score Architecture Diagram

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STUDENT SUBMITS ATTEMPT                       │
│                                                                       │
│  Request: { sessionId, correct, timeTaken }                         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              learning.controller.js - submitAttempt()               │
│                                                                       │
│  1. Validate session & mastery profile                              │
│  2. Determine expectedSeconds from difficulty:                      │
│     - easy → 40s                                                     │
│     - medium → 70s                                                   │
│     - hard → 110s                                                    │
│  3. CREATE StudyActivity:                                           │
│     - accuracy: 0 or 1                                               │
│     - responseTime: timeTaken (seconds)                             │
│     - expectedSeconds: 40/70/110                                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FETCH RECENT ACTIVITIES                        │
│                                                                       │
│  Query: StudyActivity.find({                                        │
│    userId: req.user.id,                                             │
│    subject: session.subject                                         │
│  })                                                                  │
│  .sort({ timestamp: -1 })                                           │
│  .limit(20)                                                         │
│  .select('accuracy responseTime expectedSeconds')                   │
│                                                                       │
│  Result: [activity1, activity2, ..., activityN] (N ≤ 20)           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│            utils/confidence.js - computeConfidence()                │
│                                                                       │
│  INPUT: { activities: [...] }                                       │
│                                                                       │
│  STEP 1: Calculate Accuracy                                         │
│  ─────────────────────────                                          │
│  accuracyScore = sum(a.accuracy) / activities.length                │
│  Example: 8 correct out of 10 = 0.80                               │
│                                                                       │
│  STEP 2: Calculate Speed for Each Attempt                           │
│  ───────────────────────────────────────                            │
│  For each activity:                                                 │
│    responseTime = a.responseTime > 0 ?                              │
│                   a.responseTime : a.expectedSeconds                │
│    speedAttempt = clamp01(                                          │
│                     a.expectedSeconds / responseTime                │
│                   )                                                 │
│                                                                       │
│  Example:                                                           │
│    Expected: 70s, Took 50s → 70/50 = 1.4 → clamp → 1.0             │
│    Expected: 70s, Took 90s → 70/90 = 0.78 → (stays 0.78)          │
│                                                                       │
│  Result: speedAttempts = [1.0, 0.78, 0.93, 0.70, ...]             │
│                                                                       │
│  STEP 3: Calculate Median Speed                                     │
│  ─────────────────────────────                                      │
│  speedScore = median(speedAttempts)                                 │
│                                                                       │
│  Example: [0.58, 0.64, 0.70, 0.78, 0.93, 1.0, 1.0, 1.0, 1.0, 1.0]│
│           → sorted →                                                │
│           → median = (0.93 + 1.0) / 2 = 0.965 → round to 0.97     │
│                                                                       │
│  STEP 4: Calculate Weighted Confidence                              │
│  ──────────────────────────────────────                             │
│  confidence = 0.7 × accuracyScore + 0.3 × speedScore                │
│  confidence = 0.7 × 0.80 + 0.3 × 0.97                              │
│  confidence = 0.56 + 0.291 = 0.851 → round to 0.85                │
│                                                                       │
│  OUTPUT: {                                                          │
│    confidence: 0.85,                                                │
│    accuracyScore: 0.80,                                             │
│    speedScore: 0.97,                                                │
│    attemptsUsed: 10                                                 │
│  }                                                                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│         UPDATE MASTERY PROFILE & SEND RESPONSE                      │
│                                                                       │
│  masteryProfile.confidenceScore = 0.85                              │
│  masteryProfile.save()                                              │
│                                                                       │
│  Response: {                                                        │
│    success: true,                                                   │
│    feedback: "Good reasoning. Keep going.",                         │
│    masteryPercentage: 65,                                           │
│    confidenceScore: 0.85,                                           │
│    confidenceBreakdown: {                                           │
│      accuracyScore: 0.80,                                           │
│      speedScore: 0.97,                                              │
│      attemptsUsed: 10                                               │
│    }                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Edge Case Handling

```
┌─────────────────────────────────────────────────────────────────────┐
│                      EDGE CASES & SAFE DEFAULTS                     │
└─────────────────────────────────────────────────────────────────────┘

1. responseTime ≤ 0
   ├─ Issue: Division by zero
   └─ Solution: Use expectedSeconds as neutral speedAttempt
                (same expected time = speedAttempt = 1.0 before clamp)

2. Very large responseTime (e.g., 500s when expected 70s)
   ├─ Issue: speedAttempt becomes very small (0.14)
   └─ Solution: Clamp to [0,1], use median to ignore outliers

3. No StudyActivities exist yet
   ├─ Issue: Can't compute confidence
   └─ Solution: Return default { confidence: 0.5, ... }

4. Only 1-4 activities exist
   ├─ Issue: Not enough data
   └─ Solution: Use available activities, fallback to diagnostic baseline

5. NaN or Infinity in calculations
   ├─ Issue: Invalid numbers break scoring
   └─ Solution: clamp01() catches and returns safe value (0.5)

6. Invalid activity records (missing fields)
   ├─ Issue: Bad data corrupts scoring
   └─ Solution: Filter out invalid records, use only valid ones

7. No MasteryProfile found
   ├─ Issue: Can't update score
   └─ Solution: Return 404 error (safe fail)

All cases handled ✅
```

---

## Component Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                     CONFIDENCE CALCULATION SYSTEM                     │
└──────────────────────────────────────────────────────────────────────┘

┌─ Core Module ──────────────────┐
│  src/utils/confidence.js       │
│                                │
│  ✓ clamp01(x)                  │
│    └─ Clamps to [0,1]          │
│                                │
│  ✓ median(arr)                 │
│    └─ Robust median calc       │
│                                │
│  ✓ computeConfidence({...})    │
│    └─ Main scoring logic       │
└────────────────────────────────┘

┌─ Controller Integration ───────┐
│  learning.controller.js        │
│                                │
│  submitAttempt():              │
│  ├─ Create StudyActivity       │
│  ├─ Fetch last 20 activities   │
│  ├─ Call computeConfidence()   │
│  ├─ Update MasteryProfile      │
│  └─ Return breakdown in JSON   │
└────────────────────────────────┘

┌─ Diagnostic Baseline ──────────┐
│  diagnostic.controller.js      │
│                                │
│  subjectDiagnostic():          │
│  ├─ Set initial confidence     │
│  ├─ Use clamp01() for safety   │
│  └─ Later attempts refine it   │
└────────────────────────────────┘

┌─ Data Model ───────────────────┐
│  StudyActivity.js              │
│                                │
│  Fields:                       │
│  ├─ userId                     │
│  ├─ subject                    │
│  ├─ accuracy (0 or 1)         │
│  ├─ responseTime (seconds)    │
│  ├─ expectedSeconds (NEW)      │
│  └─ timestamp                  │
└────────────────────────────────┘

┌─ MasteryProfile Storage ───────┐
│  models/MasteryProfile.js      │
│                                │
│  Fields:                       │
│  ├─ userId                     │
│  ├─ subject                    │
│  ├─ masteryPercentage          │
│  ├─ confidenceScore (UPDATED)  │
│  └─ ...other fields            │
└────────────────────────────────┘
```

---

## Confidence Score Over Time

```
                Confidence Score Trajectory
                
    1.0 │         ╱╱
        │        ╱╱
    0.8 │    ╱╱╱     ← Stabilizes with consistent accuracy & speed
        │   ╱╱
    0.6 │  ╱╱        ← Grows as student improves
        │ ╱╱
    0.4 │╱           ← Starts at diagnostic baseline
        │
    0.2 │
        │
      0 └─────────────────────────────────── Time / Attempts
          1  5  10  15  20  25  30  35  40

Key Properties:
├─ Deterministic: Same activities = same score
├─ Stable: Median makes it resistant to outliers
├─ Responsive: Updates every attempt
├─ Fair: Accounts for both accuracy & speed
└─ Explainable: Breakdown available in response
```

---

## Example Timeline

```
Day 1: Initial Diagnostic
├─ Score: 75% accuracy
├─ confidenceScore = 0.75 (baseline)
└─ confidenceBreakdown: { accuracyScore: ?, speedScore: ? } (N/A)

Day 1: First Learning Attempt
├─ Correct, took 55s (expected 70s for easy)
├─ confidenceScore = 0.5 × 1.0 (accuracy) + 0.3 × 1.0 (speed) = 1.0
└─ confidenceBreakdown: { accuracyScore: 1.0, speedScore: 1.0, attemptsUsed: 1 }

Day 2: After 5 Attempts
├─ 4 correct, 1 incorrect (accuracyScore = 0.8)
├─ Speeds: [60, 70, 65, 80, 120] → speedScore ≈ 0.9
├─ confidenceScore = 0.7 × 0.8 + 0.3 × 0.9 = 0.83
└─ confidenceBreakdown: { accuracyScore: 0.80, speedScore: 0.90, attemptsUsed: 5 }

Day 5: After 20 Attempts (Stable)
├─ 16 correct, 4 incorrect (accuracyScore = 0.8)
├─ Speeds stabilize (speedScore ≈ 0.85)
├─ confidenceScore ≈ 0.82 (stabilized!)
└─ confidenceBreakdown: { accuracyScore: 0.80, speedScore: 0.85, attemptsUsed: 20 }
```

---

## Formula Visualization

```
Confidence = 0.7 × Accuracy + 0.3 × Speed

Fast & Accurate:
├─ Accuracy: 1.0
├─ Speed: 1.0
└─ Confidence: 0.7(1.0) + 0.3(1.0) = 1.00 ✅ Excellent

Slow but Accurate:
├─ Accuracy: 1.0
├─ Speed: 0.5
└─ Confidence: 0.7(1.0) + 0.3(0.5) = 0.85 ✅ Good

Fast but Inaccurate:
├─ Accuracy: 0.5
├─ Speed: 1.0
└─ Confidence: 0.7(0.5) + 0.3(1.0) = 0.65 ⚠️ Fair

Slow & Inaccurate:
├─ Accuracy: 0.5
├─ Speed: 0.5
└─ Confidence: 0.7(0.5) + 0.3(0.5) = 0.50 ❌ Needs work
```

---

**Status:** ✅ Fully Documented & Ready for Production
