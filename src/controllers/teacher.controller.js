import User from "../models/User.js";
import MasteryProfile from "../models/MasteryProfile.js";
import LearningSession from "../models/LearningSession.js";

/*
GET ALL STUDENTS (BASIC LIST)
*/
export const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("name email createdAt");

    res.status(200).json({
      success: true,
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch students"
    });
  }
};


/*
GET SINGLE STUDENT SUMMARY
*/
export const getStudentSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    const masteryProfiles = await MasteryProfile.find({
      userId: studentId
    });

    const activeSession = await LearningSession.findOne({
      userId: studentId,
      status: "active"
    });

    // Risk flag logic (simple but effective)
    const riskFlags = masteryProfiles
      .filter(
        m => m.confidenceScore < 0.4 || m.masteryPercentage < 40
      )
      .map(m => ({
        subject: m.subject,
        reason: "Low confidence or mastery"
      }));

    res.status(200).json({
      success: true,
      masteryProfiles,
      activeSession,
      riskFlags
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch student summary"
    });
  }
};
