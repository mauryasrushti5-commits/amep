// aiService.js
import { GoogleGenAI } from "@google/genai";

// Lazy-load Gemini API (initialize on first use, not at module load time)
let ai = null;
let isRealAPIAvailable = null; // null means not yet checked

// Default to a working model (you can override with GEMINI_MODEL in .env)
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const initializeGemini = () => {
  if (isRealAPIAvailable !== null) return isRealAPIAvailable;

  const key = process.env.GEMINI_API_KEY;

  if (key && !key.includes("your_")) {
    try {
      ai = new GoogleGenAI({ apiKey: key });
      isRealAPIAvailable = true;
      console.log("✅ Gemini API initialized - using REAL AI responses");
      return true;
    } catch (error) {
      console.warn("⚠️ Gemini API initialization failed - using mock responses");
      isRealAPIAvailable = false;
      return false;
    }
  }

  isRealAPIAvailable = false;
  console.warn("⚠️ No valid Gemini API key found - using mock responses");
  return false;
};

// Mock responses for development/testing without valid API key
const mockResponses = {
  recursion:
    "To solve a recursion problem, remember every recursive function needs a **base case** (stop condition). Without it, it will call itself forever. Then: (1) define the smallest case, (2) reduce the big problem into a smaller version of itself.",
  algebra:
    "Work step-by-step: identify what you're solving for, then isolate that variable by doing the same operation on both sides. Whatever you do to one side, do to the other.",
  math:
    "Break the problem into smaller parts. List what you know, what you need, and the formula/idea connecting them. Sometimes working backwards helps.",
  default:
    "Tell me the exact problem and what you’ve tried so far. I’ll guide you step-by-step and point out the key concept to use.",
};

export const callGemini = async ({ systemPrompt = "", userPrompt = "" }) => {
  try {
    // Initialize Gemini on first call (lazy-load after dotenv is ready)
    const isRealAPIReady = initializeGemini();

    // Use real Gemini API if available
    if (isRealAPIReady && ai) {
      console.log("📡 Calling real Gemini API...");

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: userPrompt,
        // systemPrompt is passed properly (not concatenated)
        config: systemPrompt ? { systemInstruction: systemPrompt } : undefined,
      });

      const text = response?.text;
      if (!text) {
        console.error("No text returned from Gemini API");
        return "Unable to get response from AI. Please try again.";
      }

      return text;
    }

    // Fall back to mock responses
    console.log("💭 Using mock AI responses");

    const lowerQuestion = (userPrompt || "").toLowerCase();
    if (lowerQuestion.includes("recursion") || lowerQuestion.includes("base case")) {
      return mockResponses.recursion;
    } else if (lowerQuestion.includes("algebra") || lowerQuestion.includes("equation")) {
      return mockResponses.algebra;
    } else if (lowerQuestion.includes("math") || lowerQuestion.includes("solve")) {
      return mockResponses.math;
    }
    return mockResponses.default;
  } catch (error) {
    const msg = error?.message || String(error);
    console.error("Gemini error:", msg);
    console.warn("⚠️ Error occurred - falling back to mock AI response");

    // Optional: helpful logs for common cases
    if (msg.includes("429")) console.warn("➡️ Rate limit hit (free tier). Retry after some time.");
    if (msg.includes("403")) console.warn("➡️ Permission/key restriction issue.");
    if (msg.includes("404")) console.warn("➡️ Model not found/retired. Try gemini-2.5-flash.");

    // Fallback to mock response on error
    const lowerPrompt = (userPrompt || "").toLowerCase();
    if (lowerPrompt.includes("recursion")) return mockResponses.recursion;
    if (lowerPrompt.includes("algebra")) return mockResponses.algebra;
    return mockResponses.default;
  }
};
