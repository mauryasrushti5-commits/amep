import StudyActivity from "../models/StudyActivity.js";
import { getTimeBucket } from "./peakTime.service.js";

/**
 * Calculate recommended Pomodoro settings based on user context
 * Rules:
 * - Default: 25 min focus, 5 min break
 * - Peak study time: 35 min focus, 5 min break (increased focus)
 * - Low accuracy (<50%): 20 min focus, 10 min break (shorter focus, longer break)
 */
export const getRecommendedPomodoro = async (userId, subject) => {
  try {
    // Default settings
    let focusDuration = 25;
    let breakDuration = 5;
    let reason = "default";

    // Get recent study activities (last 10 for this subject)
    const recentActivities = await StudyActivity.find({
      userId,
      subject
    })
      .sort({ timestamp: -1 })
      .limit(10);

    // Calculate recent accuracy
    let recentAccuracy = 100;
    if (recentActivities.length > 0) {
      const correctCount = recentActivities.filter(
        (activity) => activity.accuracy === 1
      ).length;
      recentAccuracy = (correctCount / recentActivities.length) * 100;
    }

    // Rule 1: Check if user is in peak study time
    const currentHour = new Date().getHours();
    const currentBucket = getTimeBucket(currentHour);

    // Determine user's peak time by analyzing all activities
    const allActivities = await StudyActivity.find({
      userId,
      subject
    });

    if (allActivities.length >= 15) {
      const buckets = {};

      allActivities.forEach((activity) => {
        const hour = new Date(activity.timestamp).getHours();
        const bucket = getTimeBucket(hour);

        if (!buckets[bucket]) {
          buckets[bucket] = {
            attempts: 0,
            correct: 0
          };
        }

        buckets[bucket].attempts += 1;
        buckets[bucket].correct += activity.accuracy;
      });

      let bestBucket = null;
      let bestAccuracy = 0;

      Object.keys(buckets).forEach((bucket) => {
        const accuracy = buckets[bucket].correct / buckets[bucket].attempts;
        if (accuracy > bestAccuracy) {
          bestAccuracy = accuracy;
          bestBucket = bucket;
        }
      });

      // If currently in peak time, increase focus
      if (currentBucket === bestBucket) {
        focusDuration = 35;
        breakDuration = 5;
        reason = "peak_time";
      }
    }

    // Rule 2: Check for fatigue (low accuracy)
    if (recentAccuracy < 50 && recentActivities.length >= 5) {
      focusDuration = 20;
      breakDuration = 10;
      reason = "fatigue_detected";
    }
    // Rule 3: High accuracy = learning momentum
    else if (recentAccuracy >= 80 && recentActivities.length >= 5) {
      focusDuration = 30;
      breakDuration = 5;
      reason = "learning_momentum";
    }

    return {
      focusDuration,
      breakDuration,
      reason,
      context: {
        recentAccuracy: Math.round(recentAccuracy),
        activitiesAnalyzed: recentActivities.length,
        currentTimeSlot: currentBucket
      }
    };
  } catch (error) {
    // Return default on error
    return {
      focusDuration: 25,
      breakDuration: 5,
      reason: "default",
      context: {
        error: "Could not calculate optimal settings"
      }
    };
  }
};
