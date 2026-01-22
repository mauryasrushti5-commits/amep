import dotenv from "dotenv";
dotenv.config();

// Verify API key is loaded
if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("your_")) {
  console.log("✅ Gemini API Key loaded from .env");
} else {
  console.log("⚠️ Gemini API Key not found or invalid in .env");
}

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
