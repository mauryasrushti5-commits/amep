import LearningSession from "../models/LearningSession.js";
import MasteryProfile from "../models/MasteryProfile.js";
import StudyActivity from "../models/StudyActivity.js";
import { computeConfidence } from "../utils/confidence.js";

/*
CREATE / GET ACTIVE LEARNING SESSION
*/
export const getLearningSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, topic, subtopic } = req.query;

    if (!subject || !topic) {
      return res.status(400).json({
        success: false,
        message: "Subject and topic are required"
      });
    }

    // Check for active session
    let session = await LearningSession.findOne({
      userId,
      subject,
      topic,
      status: "active"
    });

    if (!session) {
      session = await LearningSession.create({
        userId,
        subject,
        topic,
        subtopic,
        difficulty: "easy",
        status: "active"
      });
    }

    res.status(200).json({
      success: true,
      sessionId: session._id,
      subject: session.subject,
      topic: session.topic,
      subtopic: session.subtopic,
      difficulty: session.difficulty,
      content: [],
      aiHints: []
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create learning session"
    });
  }
};


/*
SUBMIT ATTEMPT DURING LEARNING SESSION
*/
export const submitAttempt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, correct, timeTaken } = req.body;

    if (!sessionId || typeof correct !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt data"
      });
    }

    const session = await LearningSession.findById(sessionId);
    if (!session || session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive session"
      });
    }

    // Fetch mastery profile
    const masteryProfile = await MasteryProfile.findOne({
      userId,
      subject: session.subject
    });

    if (!masteryProfile) {
      return res.status(404).json({
        success: false,
        message: "Mastery profile not found"
      });
    }

    // Determine expected response time based on difficulty
    const expectedSeconds = session.difficulty === 'easy' ? 40 :
                           session.difficulty === 'medium' ? 70 : 110;

    // Log study activity
    await StudyActivity.create({
      userId,
      subject: session.subject,
      expectedSeconds,
      accuracy: correct ? 1 : 0,
      responseTime: timeTaken || 0
    });

    const recentActivities = await StudyActivity.find({
      userId,
      subject: session.subject
    })
    .sort({ timestamp: -1 })
    .limit(20)
    .select('accuracy responseTime expectedSeconds');

    const confidenceResult = computeConfidence({
      activities: recentActivities
    });

    // Update confidence score
    masteryProfile.confidenceScore = confidenceResult.confidence;

    // Simple mastery update logic (temporary)
    let masteryUpdated = false;
    if (correct) {
      masteryProfile.masteryPercentage += 2;
      masteryUpdated = true;
    }

    await masteryProfile.save();

    res.status(200).json({
      success: true,
      feedback: correct
        ? "Good reasoning. Keep going."
        : "There is a conceptual gap. Try again.",
      masteryUpdated,
      masteryPercentage: masteryProfile.masteryPercentage,
      confidenceScore: masteryProfile.confidenceScore,
      confidenceBreakdown: {
        accuracyScore: confidenceResult.accuracyScore,
        speedScore: confidenceResult.speedScore,
        attemptsUsed: confidenceResult.attemptsUsed
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Attempt submission failed"
    });
  }
};


/*
END LEARNING SESSION
*/
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await LearningSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    session.status = "completed";
    await session.save();

    res.status(200).json({
      success: true,
      message: "Learning session completed"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to end session"
    });
  }
};
