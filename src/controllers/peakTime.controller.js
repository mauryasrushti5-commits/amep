import StudyActivity from "../models/StudyActivity.js";
import { getTimeBucket } from "../services/peakTime.service.js";

export const getPeakStudyTime = async (req, res) => {
  try {
    const userId = req.user.id;

    const activities = await StudyActivity.find({ userId });

    if (activities.length < 15) {
      return res.status(200).json({
        success: true,
        ready: false,
        message: "Not enough data yet to determine peak study time."
      });
    }

    const buckets = {};

    activities.forEach(activity => {
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

    Object.keys(buckets).forEach(bucket => {
      const accuracy = buckets[bucket].correct / buckets[bucket].attempts;
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestBucket = bucket;
      }
    });

    res.status(200).json({
      success: true,
      ready: true,
      peakTime: bestBucket,
      accuracy: Math.round(bestAccuracy * 100)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate peak study time"
    });
  }
};
