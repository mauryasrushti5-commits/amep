import PomodoroSession from "../models/PomodoroSession.js";
import { getRecommendedPomodoro } from "../services/pomodoro.service.js";

/**
 * GET /api/pomodoro/recommendation
 * Returns recommended Pomodoro settings based on user's learning context
 */
export const getPomodoroRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject } = req.query;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Subject is required"
      });
    }

    const recommendation = await getRecommendedPomodoro(userId, subject);

    res.status(200).json({
      success: true,
      recommendation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get Pomodoro recommendation"
    });
  }
};

/**
 * POST /api/pomodoro/start
 * Create and start a new Pomodoro session
 */
export const startPomodoroSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, focusDuration, breakDuration, reason } = req.body;

    if (!subject || !focusDuration || !breakDuration) {
      return res.status(400).json({
        success: false,
        message: "Subject, focusDuration, and breakDuration are required"
      });
    }

    const session = await PomodoroSession.create({
      userId,
      subject,
      focusDuration,
      breakDuration,
      reason: reason || "default",
      startedAt: new Date()
    });

    res.status(201).json({
      success: true,
      sessionId: session._id,
      focusDuration: session.focusDuration,
      breakDuration: session.breakDuration,
      reason: session.reason,
      startedAt: session.startedAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to start Pomodoro session"
    });
  }
};

/**
 * PUT /api/pomodoro/end/:sessionId
 * End a Pomodoro session
 */
export const endPomodoroSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await PomodoroSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Pomodoro session not found"
      });
    }

    if (session.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    session.endedAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      message: "Pomodoro session ended",
      sessionId: session._id,
      duration: (session.endedAt - session.startedAt) / (1000 * 60), // minutes
      reason: session.reason
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to end Pomodoro session"
    });
  }
};

/**
 * GET /api/pomodoro/sessions
 * Get user's Pomodoro session history
 */
export const getPomodoroHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, limit = 10 } = req.query;

    let query = { userId };
    if (subject) {
      query.subject = subject;
    }

    const sessions = await PomodoroSession.find(query)
      .sort({ startedAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      sessions,
      count: sessions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve Pomodoro history"
    });
  }
};
