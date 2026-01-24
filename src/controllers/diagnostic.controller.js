import DiagnosticRecord from "../models/DiagnosticRecord.js";
import MasteryProfile from "../models/MasteryProfile.js";
import { clamp01 } from "../utils/confidence.js";

/*
SUBJECT LEVEL DIAGNOSTIC
Runs once per subject
*/
export const subjectDiagnostic = async (req, res) => {
  try {
    const { subject, answers } = req.body;
    const userId = req.user.id;

    if (!subject || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Invalid diagnostic data"
      });
    }

    // Simple evaluation logic (temporary, will improve later)
    const score = answers.filter(a => a.correct).length;
    const percentage = Math.round((score / answers.length) * 100);

    let level = "Beginner";
    if (percentage > 70) level = "Intermediate";
    if (percentage > 90) level = "Advanced";

    const masteryProfile = await MasteryProfile.create({
      userId,
      subject,
      overallLevel: level,
      masteryPercentage: percentage,
      strongConcepts: [],
      weakConcepts: [],
      learningSpeed: "medium",
      confidenceScore: clamp01(percentage / 100)
    });

    await DiagnosticRecord.create({
      userId,
      subject,
      type: "subject-level",
      topic: null,
      answers,
      analysisSummary: `Initial level: ${level}`
    });

    res.status(200).json({
      success: true,
      masteryProfile
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Subject diagnostic failed"
    });
  }
};


/*
SUBTOPIC LEVEL MINI DIAGNOSTIC
Runs before every new subtopic
*/
export const subtopicDiagnostic = async (req, res) => {
  try {
    const { subject, topic, answers } = req.body;
    const userId = req.user.id;

    if (!subject || !topic || !answers) {
      return res.status(400).json({
        success: false,
        message: "Invalid subtopic diagnostic data"
      });
    }

    const correctCount = answers.filter(a => a.correct).length;

    const entryLevel = correctCount >= Math.ceil(answers.length / 2)
      ? "advanced"
      : "basic";

    await DiagnosticRecord.create({
      userId,
      subject,
      type: "subtopic-level",
      topic,
      answers,
      analysisSummary: `Entry level: ${entryLevel}`
    });

    res.status(200).json({
      success: true,
      entryLevel
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Subtopic diagnostic failed"
    });
  }
};
