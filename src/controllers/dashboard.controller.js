import MasteryProfile from "../models/MasteryProfile.js";
import LearningSession from "../models/LearningSession.js";

/*
STUDENT DASHBOARD DATA
*/
export const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch mastery profiles
    const masteryProfiles = await MasteryProfile.find({ userId });

    // New user (no diagnostics done yet)
    if (masteryProfiles.length === 0) {
      return res.status(200).json({
        success: true,
        userType: "new",
        message: "Welcome! Let's understand how you learn.",
        mastery: [],
        currentLearning: null,
        bestLearningHours: null,
        cta: "Start Diagnostic Test"
      });
    }

    // Returning user
    const activeSession = await LearningSession.findOne({
      userId,
      status: "active"
    });

    const masterySummary = masteryProfiles.map(profile => ({
      subject: profile.subject,
      masteryPercentage: profile.masteryPercentage,
      confidenceScore: profile.confidenceScore,
      level: profile.overallLevel
    }));

    // Simple heuristic for best learning hours (placeholder)
    const bestLearningHours = {
      start: "7:00 PM",
      end: "9:00 PM",
      reason: "Highest accuracy observed in this time window"
    };

    res.status(200).json({
      success: true,
      userType: "returning",
      mastery: masterySummary,
      currentLearning: activeSession
        ? {
            subject: activeSession.subject,
            topic: activeSession.topic,
            difficulty: activeSession.difficulty
          }
        : null,
      bestLearningHours,
      cta: activeSession ? "Continue Learning" : "Resume Learning"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard"
    });
  }
};
