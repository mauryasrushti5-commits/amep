/**
 * Confidence calculation utilities
 * Deterministic confidence scoring based on accuracy and response time
 */

/**
 * Clamps a value to [0, 1]
 * @param {number} x - Value to clamp
 * @returns {number} Clamped value between 0 and 1
 */
export function clamp01(x) {
  if (typeof x !== 'number' || isNaN(x)) return 0.5;
  return Math.max(0, Math.min(1, x));
}

/**
 * Calculates the median of an array of numbers
 * @param {number[]} arr - Array of numbers
 * @returns {number} Median value, or 0 if empty array
 */
export function median(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Computes confidence score based on recent study activities
 * @param {Object} params
 * @param {Array} params.activities - Array of StudyActivity objects with accuracy (0/1), responseTime (seconds), expectedSeconds
 * @returns {Object} Confidence calculation result
 * @returns {number} result.confidence - Confidence score (0-1, rounded to 2 decimals)
 * @returns {number} result.accuracyScore - Mean accuracy over activities
 * @returns {number} result.speedScore - Median speed score
 * @returns {number} result.attemptsUsed - Number of activities used
 */
export function computeConfidence({ activities }) {
  if (!Array.isArray(activities)) {
    return {
      confidence: 0.5,
      accuracyScore: 0.5,
      speedScore: 0.5,
      attemptsUsed: 0
    };
  }

  const validActivities = activities.filter(a =>
    typeof a.accuracy === 'number' &&
    typeof a.responseTime === 'number' &&
    typeof a.expectedSeconds === 'number'
  );

  if (validActivities.length === 0) {
    return {
      confidence: 0.5,
      accuracyScore: 0.5,
      speedScore: 0.5,
      attemptsUsed: 0
    };
  }

  // Calculate accuracy score (mean accuracy)
  const accuracyScore = validActivities.reduce((sum, a) => sum + a.accuracy, 0) / validActivities.length;

  // Calculate speed scores for each attempt
  const speedAttempts = validActivities.map(a => {
    const responseTime = a.responseTime > 0 ? a.responseTime : a.expectedSeconds; // Avoid division by zero
    return clamp01(a.expectedSeconds / responseTime);
  });

  // Speed score is median of speed attempts (robust against outliers)
  const speedScore = median(speedAttempts);

  // Weighted confidence: 70% accuracy, 30% speed
  const confidence = 0.7 * accuracyScore + 0.3 * speedScore;

  return {
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
    accuracyScore: Math.round(accuracyScore * 100) / 100,
    speedScore: Math.round(speedScore * 100) / 100,
    attemptsUsed: validActivities.length
  };
}