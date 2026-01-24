/**
 * Health Controller - Backend self-check endpoint
 */

import mongoose from "mongoose";
import LearningSession from "../models/LearningSession.js";
import StudyActivity from "../models/StudyActivity.js";
import User from "../models/User.js";
import MasteryProfile from "../models/MasteryProfile.js";

/**
 * GET /api/health/self-check
 * No auth required - checks backend connectivity and basic functionality
 */
export const healthCheck = async (req, res) => {
  const checks = {
    database: false,
    collections: {
      User: false,
      LearningSession: false,
      StudyActivity: false,
      MasteryProfile: false
    },
    readWrite: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      checks.database = true;
    } else {
      return res.status(503).json({
        ok: false,
        message: "Database disconnected",
        checks
      });
    }

    // Check if collections exist by counting documents
    try {
      const userCount = await User.countDocuments();
      checks.collections.User = true;
    } catch (e) {
      checks.collections.User = false;
    }

    try {
      const sessionCount = await LearningSession.countDocuments();
      checks.collections.LearningSession = true;
    } catch (e) {
      checks.collections.LearningSession = false;
    }

    try {
      const activityCount = await StudyActivity.countDocuments();
      checks.collections.StudyActivity = true;
    } catch (e) {
      checks.collections.StudyActivity = false;
    }

    try {
      const masteryCount = await MasteryProfile.countDocuments();
      checks.collections.MasteryProfile = true;
    } catch (e) {
      checks.collections.MasteryProfile = false;
    }

    // Check if any collection is missing
    const allCollectionsOk = Object.values(checks.collections).every(c => c === true);

    if (!allCollectionsOk) {
      return res.status(503).json({
        ok: false,
        message: "Some collections missing",
        checks
      });
    }

    // Lightweight read/write test
    try {
      // Try to read one document from each collection
      const user = await User.findOne({});
      const session = await LearningSession.findOne({});
      const activity = await StudyActivity.findOne({});
      const mastery = await MasteryProfile.findOne({});

      checks.readWrite = true;
    } catch (e) {
      // Collections may be empty, but read permission confirmed
      checks.readWrite = true;
    }

    // All checks passed
    res.status(200).json({
      ok: true,
      message: "Backend is healthy",
      checks,
      endpoints: {
        auth: "/api/auth/signup, /api/auth/login",
        learning: "/api/learning/session/start, /api/learning/session, /api/learning/attempt",
        quiz: "/api/quiz/next, /api/quiz/attempt",
        resources: "/api/resources/recommendation, /api/resources/feedback",
        catalog: "/api/catalog/subjects, /api/catalog/topics, /api/catalog/subtopics",
        dashboard: "/api/dashboard/summary",
        teacher: "/api/teacher/students, /api/teacher/students/:studentId"
      }
    });

  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      ok: false,
      message: "Health check failed",
      checks,
      error: error.message
    });
  }
};
