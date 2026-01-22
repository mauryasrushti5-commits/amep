import LearningSession from "../models/LearningSession.js";
import MasteryProfile from "../models/MasteryProfile.js";
import { callGemini } from "../services/aiService.js";

/*
STUDENT ASKS AI A QUESTION DURING LEARNING SESSION
*/
export const askAIQuestion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, question } = req.body;

    if (!sessionId || !question) {
      return res.status(400).json({
        success: false,
        message: "Session ID and question are required"
      });
    }

    const session = await LearningSession.findById(sessionId);
    if (!session || session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive learning session"
      });
    }

    const masteryProfile = await MasteryProfile.findOne({
      userId,
      subject: session.subject
    });

    const systemPrompt = `
You are an adaptive AI tutor.
You must NOT give full solutions unless mastery is high.
You prefer hints and guided reasoning.
Current subject: ${session.subject}
Topic: ${session.topic}
Difficulty: ${session.difficulty}
Student mastery level: ${masteryProfile?.overallLevel}
Confidence score: ${masteryProfile?.confidenceScore}
`;

    const userPrompt = `
Student question:
"${question}"

Respond with a helpful explanation or hint.
Do not jump to final answers.
`;

    const aiResponse = await callGemini({
      systemPrompt,
      userPrompt
    });

    res.status(200).json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "AI response failed"
    });
  }
};
