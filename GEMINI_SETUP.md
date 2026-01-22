# AMEP Server - Complete Setup & Fix Guide

## 🔴 Current Issue: Invalid Gemini API Key

The API key in `.env` is not valid. You need to get a valid API key from Google.

## ✅ How to Get a Valid Gemini API Key

### Step 1: Go to Google AI Studio
1. Visit: https://aistudio.google.com/
2. Sign in with your Google account (create one if needed)

### Step 2: Create API Key
1. Click on **"Get API Key"** in the left sidebar
2. Click **"Create API key in new project"**
3. A modal will appear with your new API key
4. **Copy the API key** (it starts with `AIzaSy...`)

### Step 3: Update `.env` File
Replace this line in `.env`:
```
GEMINI_API_KEY=your_valid_gemini_api_key_here
```

With your actual API key:
```
GEMINI_API_KEY=AIzaSy_YOUR_ACTUAL_KEY_HERE
```

### Step 4: Restart Server
```bash
npm run dev
```

---

## 📋 API Endpoints Summary

### Authentication
```bash
# Signup
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Diagnostics
```bash
# Subject-level diagnostic
POST /api/diagnostic/subject
Authorization: Bearer <token>
{
  "subject": "Mathematics",
  "answers": [
    { "question": "What is 2+2?", "correct": true },
    { "question": "What is 5*3?", "correct": true }
  ]
}

# Subtopic-level diagnostic
POST /api/diagnostic/subtopic
Authorization: Bearer <token>
{
  "subject": "Mathematics",
  "topic": "Algebra",
  "answers": [{ "question": "Solve x+5=10", "correct": true }]
}
```

### Learning Sessions
```bash
# Get/Create learning session
GET /api/learning/session?subject=Mathematics&topic=Algebra&subtopic=LinearEquations
Authorization: Bearer <token>

# Submit attempt
POST /api/learning/attempt
Authorization: Bearer <token>
{
  "sessionId": "...",
  "correct": true,
  "timeTaken": 45
}

# End session
POST /api/learning/end
Authorization: Bearer <token>
{
  "sessionId": "..."
}
```

### AI Tutoring
```bash
# Ask AI Question (requires valid API key)
POST /api/ai/ask
Authorization: Bearer <token>
{
  "sessionId": "...",
  "question": "Why does recursion need a base case?"
}
```

---

## 🚀 Quick Start

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Get Gemini API Key** (see above)

3. **Update `.env` with API key**

4. **Start server**:
   ```bash
   npm run dev
   ```

5. **Server should show**:
   ```
   Server running on port 5000
   MongoDB connected successfully
   ```

---

## 🔧 Troubleshooting

### Error: "API key not valid"
- Check your `.env` file has the correct API key
- Get a new key from https://aistudio.google.com/

### Error: "MongoDB connection failed"
- Ensure MongoDB is running on `127.0.0.1:27017`
- Or update `MONGO_URI` in `.env` to your MongoDB instance

### Port 5000 already in use
```bash
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 📦 Tech Stack

- **Backend**: Express.js + Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **AI**: Google Gemini API (gemini-pro model)
- **Password Hashing**: Bcrypt
- **Environment**: Dotenv

---

## 🎓 System Features

✅ User authentication (signup/login)
✅ Subject & subtopic diagnostics
✅ Personalized learning sessions
✅ Mastery tracking
✅ AI-powered tutoring with adaptive hints
✅ Real-time mastery profile updates

---

## 📝 Important Notes

- **JWT_SECRET** should be changed in production
- **API Key** should never be committed to git
- Use `.gitignore` to exclude `.env` file
- All routes (except auth) require JWT token in Authorization header format: `Bearer <token>`
