# Confidence Score Implementation - Integration Guide

## Overview
This implementation adds deterministic, explainable confidence scoring to AMEP based on student accuracy and response time. No AI/Gemini is used—it's pure mathematics.

## What Was Changed

### Files Created
1. **[src/utils/confidence.js](src/utils/confidence.js)** - Core confidence calculation logic
   - `clamp01(x)` - Value clamping to [0, 1]
   - `median(arr)` - Robust median calculation
   - `computeConfidence({ activities })` - Main scoring function

2. **[CONFIDENCE_IMPLEMENTATION.md](CONFIDENCE_IMPLEMENTATION.md)** - Detailed technical documentation
3. **[TEST_CONFIDENCE.js](TEST_CONFIDENCE.js)** - Test suite with 5 validation cases

### Files Modified
1. **[src/controllers/learning.controller.js](src/controllers/learning.controller.js)**
   - Updated `submitAttempt()` to compute and store confidence scores
   - Fetches last 20 study activities per subject
   - Returns confidence breakdown for transparency

2. **[src/controllers/diagnostic.controller.js](src/controllers/diagnostic.controller.js)**
   - Updated `subjectDiagnostic()` to set baseline confidence safely
   - Uses `clamp01()` to ensure [0,1] range

3. **[src/models/StudyActivity.js](src/models/StudyActivity.js)**
   - Added `expectedSeconds` field to track difficulty baseline

## How It Works

### Confidence Formula
```
confidenceScore = 0.7 × accuracyScore + 0.3 × speedScore

Where:
  accuracyScore = mean(accuracy) over last ≤20 activities
  speedScore = median(speedAttempt) over last ≤20 activities
  speedAttempt = clamp01(expectedSeconds / responseTime)
```

### Expected Response Times
- **Easy**: 40 seconds
- **Medium**: 70 seconds  
- **Hard**: 110 seconds

### Key Properties
✅ **Deterministic** - Same inputs always produce same output  
✅ **Explainable** - Returns breakdown of accuracy & speed components  
✅ **Stable** - Uses median to resist outliers  
✅ **Safe** - All values clamped to [0, 1], handles NaN/edge cases  
✅ **Normalized** - Always [0, 1], no Infinity or negative values  

## API Response Example

```json
{
  "success": true,
  "feedback": "Good reasoning. Keep going.",
  "masteryUpdated": true,
  "masteryPercentage": 65,
  "confidenceScore": 0.78,
  "confidenceBreakdown": {
    "accuracyScore": 0.80,
    "speedScore": 0.75,
    "attemptsUsed": 15
  }
}
```

## Testing

Run the test suite:
```bash
node TEST_CONFIDENCE.js
```

Expected output shows 5 test cases covering:
- Mixed attempts (typical student)
- Fast & accurate learner (confidence = 1.0)
- Struggling learner (confidence = 0.29)
- Few activities edge case
- Outlier resilience (median robustness)

## Database Migration Note

⚠️ **StudyActivity Schema Change:**
The `expectedSeconds` field was added to `StudyActivity`. If you have existing data:

```javascript
// Optional: Add field to old documents
db.studyactivities.updateMany(
  { expectedSeconds: { $exists: false } },
  { $set: { expectedSeconds: 70 } } // default to medium
)
```

New activities will include this field automatically.

## Backward Compatibility

✅ **No breaking changes** to API contracts  
✅ **Existing MasteryProfiles** continue to work  
✅ **Optional fields** in response (includes new `confidenceBreakdown`)  
✅ **Graceful fallback** if < 5 activities exist

## No Changes Required To

- ✓ JWT authentication
- ✓ User model
- ✓ Learning session orchestration
- ✓ Gemini AI integration
- ✓ Other controllers & routes

## Example Calculation

**Student with 10 recent attempts on Math (medium difficulty):**

```
7 correct, 3 incorrect → accuracyScore = 0.70

Response times: 50s, 65s, 90s, 100s, 75s, 120s, 55s, 70s, 110s, 60s
expectedSeconds = 70s for all (medium difficulty)

speedAttempts: [1.0, 1.0, 0.78, 0.70, 0.93, 0.58, 1.0, 1.0, 0.64, 1.0]
sorted: [0.58, 0.64, 0.70, 0.78, 0.93, 1.0, 1.0, 1.0, 1.0, 1.0]
speedScore = median = 0.87

confidence = 0.7 × 0.70 + 0.3 × 0.87 = 0.49 + 0.26 = 0.75
```

Returns: `{ confidenceScore: 0.75, accuracyScore: 0.70, speedScore: 0.87, attemptsUsed: 10 }`

## Debugging

To debug confidence calculations, enable API response `confidenceBreakdown`:
```javascript
{
  "confidenceBreakdown": {
    "accuracyScore": 0.70,      // Check: is this realistic?
    "speedScore": 0.87,         // Check: are speeds reasonable?
    "attemptsUsed": 10          // Check: enough data points?
  }
}
```

If `attemptsUsed < 5`, the system is using limited data (expected initially).

## Future Enhancements

Potential improvements (outside scope of this task):
- Exponential weighting (recent attempts matter more)
- Difficulty-specific baselines
- Learning curve tracking (confidence growth over time)
- Adaptive weights (30/70 split based on subject type)
- Conceptual consistency checks (don't improve accuracy on typos)

## Support

For issues or questions, see [CONFIDENCE_IMPLEMENTATION.md](CONFIDENCE_IMPLEMENTATION.md) for detailed technical specs.
