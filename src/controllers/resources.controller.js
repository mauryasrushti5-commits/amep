/**
 * Resources Controller - Resource recommendations with Gemini titles
 */

import LearningSession from "../models/LearningSession.js";
import MasteryProfile from "../models/MasteryProfile.js";
import { buildResourceLinks, parseGeminiResourceResponse, generateFallbackTitles } from "../utils/resources.js";
import { callGemini } from "../services/aiService.js";

/**
 * GET /api/resources/recommendation?sessionId=...
 * Returns resource links based on session weak concepts
 */
export const getResourceRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId required"
      });
    }

    const session = await LearningSession.findById(sessionId);
    if (!session || session.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Session not found or unauthorized"
      });
    }

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

    // Determine if we have weak concepts
    const hasWeakConcepts = masteryProfile.weakConcepts && 
                            masteryProfile.weakConcepts.length > 0;
    
    const context = hasWeakConcepts
      ? `weak concepts: ${masteryProfile.weakConcepts.join(", ")}`
      : `topic: ${session.topic}`;

    // Ask Gemini for resource titles (only)
    const systemPrompt = `You are an educational resource recommender. Your ONLY task is to suggest 3 learning resource titles (NO URLs, NO markdown links).
    
    Requirements:
    - Output MUST be valid JSON only
    - Format: { "resourceTitles": ["title1", "title2", "title3"] }
    - Each title should be SHORT (max 60 chars) and SPECIFIC
    - NO markdown, NO links, NO explanations
    - Focus on ${session.subject} - ${session.topic}`;

    const userPrompt = `Suggest 3 resource titles for learning about ${context} in ${session.subject}. Response must be JSON only.`;

    let titles = generateFallbackTitles(session.topic);

    try {
      const geminiResponse = await callGemini({
        sessionId,
        question: userPrompt,
        systemPrompt
      });

      if (geminiResponse && geminiResponse.trim()) {
        const parsedTitles = parseGeminiResourceResponse(geminiResponse);
        if (parsedTitles.length === 3) {
          titles = parsedTitles;
        }
      }
    } catch (geminiError) {
      // Fallback gracefully if Gemini fails
      console.warn("Gemini resource generation failed, using fallback:", geminiError.message);
    }

    // Build safe links from titles
    const resources = buildResourceLinks({
      subject: session.subject,
      topic: session.topic,
      titles,
      isWeakConcept: hasWeakConcepts
    });

    res.status(200).json({
      success: true,
      resources
    });

  } catch (error) {
    console.error("Get resource recommendation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get resource recommendation"
    });
  }
};

/**
 * POST /api/resources/feedback (optional)
 * User provides feedback on resource usefulness
 */
export const submitResourceFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { resourceLabel, resourceTitle, helpful } = req.body;

    if (typeof helpful !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "helpful flag required"
      });
    }

    // For now, just log and return success
    console.log(`Resource feedback from ${userId}: ${resourceLabel} - ${resourceTitle} - ${helpful}`);

    res.status(200).json({
      success: true,
      message: "Feedback recorded"
    });

  } catch (error) {
    console.error("Submit resource feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback"
    });
  }
};
