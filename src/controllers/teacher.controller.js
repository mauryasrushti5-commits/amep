import User from "../models/User.js";
import MasteryProfile from "../models/MasteryProfile.js";
import LearningSession from "../models/LearningSession.js";
import StudyActivity from "../models/StudyActivity.js";

/**
 * GET ALL STUDENTS
 * Returns all users with role === "student"
 * Each student includes: basic info, masteryProfiles, and lastActive timestamp
 * 
 * Endpoint: GET /api/teacher/students
 */
export const getStudents = async (req, res) => {
  try {
    // Query all students without password
    const students = await User.find({ role: "student" }).select("-password");

    // Enrich each student with mastery profiles and last activity
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        // Get all mastery profiles for this student
        const masteryProfiles = await MasteryProfile.find({
          userId: student._id
        });

        // Get most recent activity timestamp
        const lastActivity = await StudyActivity.findOne({
          userId: student._id
        }).sort({ timestamp: -1 }).select("timestamp");

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          role: student.role,
          createdAt: student.createdAt,
          masteryProfiles,
          lastActive: lastActivity ? lastActivity.timestamp : null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        students: enrichedStudents
      }
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students"
    });
  }
};

/**
 * GET SINGLE STUDENT SUMMARY
 * Returns comprehensive student information including:
 * - Basic student info (no password)
 * - All mastery profiles
 * - Last 10 learning sessions
 * - Last 20 study activities
 * 
 * Endpoint: GET /api/teacher/students/:studentId
 */
export const getStudentSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate student exists and has role === "student"
    const student = await User.findById(studentId).select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    if (student.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "User is not a student"
      });
    }

    // Fetch mastery profiles
    const masteryProfiles = await MasteryProfile.find({
      userId: studentId
    });

    // Fetch recent learning sessions (last 10)
    const recentSessions = await LearningSession.find({
      userId: studentId
    }).sort({ updatedAt: -1 }).limit(10);

    // Fetch recent study activities (last 20)
    const recentActivities = await StudyActivity.find({
      userId: studentId
    }).sort({ timestamp: -1 }).limit(20);

    res.status(200).json({
      success: true,
      data: {
        student,
        masteryProfiles,
        recentSessions,
        recentActivities
      }
    });
  } catch (error) {
    console.error("Get student summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student summary"
    });
  }
};
