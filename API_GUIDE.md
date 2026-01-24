# AMEP Backend Implementation - Full API Guide

## Overview

Implemented complete backend system with:
- **Topic Catalog** (DSA + Python-ML)
- **Quiz Engine** (Micro-cycles with deterministic reasoning)
- **Confidence Scoring** (Accuracy + Speed)
- **Resource Recommendations** (Gemini titles + safe links)

All endpoints follow deterministic backend orchestration with Gemini as explanation/resource provider only.

---

## Authentication Header (All Endpoints)

```
Authorization: Bearer <JWT_TOKEN>
```

Obtain JWT by calling `/api/auth/login` first.

---

## A) TOPIC CATALOG ENDPOINTS

### 1. GET /api/catalog/subjects
**Purpose:** Retrieve all available subjects  
**Auth:** Not required  
**Query Params:** None

**Request:**
```bash
GET http://localhost:5000/api/catalog/subjects
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dsa",
      "name": "DSA",
      "description": "Data Structures and Algorithms for Engineering",
      "topicCount": 10
    },
    {
      "id": "python-ml",
      "name": "Python-ML",
      "description": "Python for Machine Learning",
      "topicCount": 10
    }
  ]
}
```

---

### 2. GET /api/catalog/topics
**Purpose:** Get all topics for a subject  
**Auth:** Not required  
**Query Params:** 
- `subject` (required): "dsa" or "python-ml"

**Request:**
```bash
GET http://localhost:5000/api/catalog/topics?subject=dsa
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "arrays",
      "name": "Arrays",
      "subtopicCount": 6
    },
    {
      "id": "strings",
      "name": "Strings",
      "subtopicCount": 4
    },
    {
      "id": "linked-list",
      "name": "Linked List",
      "subtopicCount": 4
    }
  ]
}
```

---

### 3. GET /api/catalog/subtopics
**Purpose:** Get all subtopics for a topic  
**Auth:** Not required  
**Query Params:**
- `subject` (required): "dsa" or "python-ml"
- `topic` (required): Topic ID or name

**Request:**
```bash
GET http://localhost:5000/api/catalog/subtopics?subject=dsa&topic=arrays
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "array-basics",
      "name": "Array Basics"
    },
    {
      "id": "array-manipulation",
      "name": "Array Manipulation"
    },
    {
      "id": "searching",
      "name": "Searching (Linear, Binary)"
    },
    {
      "id": "sorting",
      "name": "Sorting Algorithms"
    },
    {
      "id": "two-pointers",
      "name": "Two Pointers Technique"
    },
    {
      "id": "sliding-window",
      "name": "Sliding Window"
    }
  ]
}
```

---

### 4. GET /api/catalog/validate (Optional)
**Purpose:** Validate if a subject/topic/subtopic path exists  
**Auth:** Not required  
**Query Params:**
- `subject` (required)
- `topic` (required)
- `subtopic` (optional)

**Request:**
```bash
GET http://localhost:5000/api/catalog/validate?subject=dsa&topic=arrays&subtopic=array-basics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "subject": { "id": "dsa", "name": "DSA", ... },
    "topic": { "id": "arrays", "name": "Arrays", ... },
    "subtopic": { "id": "array-basics", "name": "Array Basics" }
  }
}
```

---

## B) QUIZ ENGINE ENDPOINTS

### 1. POST /api/learning/session/start
**Purpose:** Start a new learning session  
**Auth:** Required  
**Body:**
```json
{
  "subject": "dsa",
  "topic": "arrays",
  "subtopic": "array-basics"
}
```

**Request:**
```bash
POST http://localhost:5000/api/learning/session/start
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "subject": "dsa",
  "topic": "arrays",
  "subtopic": "array-basics"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "_id": "678a1b2c3d4e5f6g7h8i9j0k",
    "userId": "678a1b2c3d4e5f6g7h8i9j0a",
    "subject": "dsa",
    "topic": "arrays",
    "subtopic": "array-basics",
    "difficulty": "medium",
    "status": "active",
    "attemptCount": 0,
    "createdAt": "2026-01-24T12:00:00Z"
  }
}
```

---

### 2. GET /api/quiz/next
**Purpose:** Get the next question in the micro-cycle  
**Auth:** Required  
**Query Params:**
- `sessionId` (required): ID from session/start

**Request:**
```bash
GET http://localhost:5000/api/quiz/next?sessionId=678a1b2c3d4e5f6g7h8i9j0k
Authorization: Bearer <JWT>
```

**Response:**
```json
{
  "success": true,
  "question": {
    "questionId": "dsa-arr-1",
    "prompt": "What is the time complexity of accessing an element by index in an array?",
    "options": [
      "O(1)",
      "O(n)",
      "O(log n)",
      "O(n^2)"
    ],
    "difficultyTag": "easy"
  },
  "reasonCode": "baseline_check",
  "cycle": {
    "index": 0,
    "position": 1,
    "total": 5
  }
}
```

**reasonCode values:**
- `baseline_check` - First or baseline question
- `fluency_drill` - Question 2, for fluency
- `edge_case_check` - Question 3, for edge cases
- `slow_response` - Based on response time analysis
- `missed_in_diagnostic` - Topic identified as weak in diagnostic

---

### 3. POST /api/quiz/attempt
**Purpose:** Submit answer to a question  
**Auth:** Required  
**Body:**
```json
{
  "sessionId": "678a1b2c3d4e5f6g7h8i9j0k",
  "questionId": "dsa-arr-1",
  "isCorrect": true,
  "responseTime": 35
}
```

**Request:**
```bash
POST http://localhost:5000/api/quiz/attempt
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "sessionId": "678a1b2c3d4e5f6g7h8i9j0k",
  "questionId": "dsa-arr-1",
  "isCorrect": true,
  "responseTime": 35
}
```

**Response (Regular Attempt):**
```json
{
  "success": true,
  "feedback": "Correct! Great work.",
  "masteryPercentage": 52,
  "confidenceScore": 0.78,
  "attemptCount": 1
}
```

**Response (End of Cycle - Every 5 Attempts):**
```json
{
  "success": true,
  "feedback": "Correct! Great work.",
  "masteryPercentage": 60,
  "confidenceScore": 0.82,
  "attemptCount": 5,
  "cycleSummary": {
    "accuracy": 80,
    "medianTime": 45,
    "weaknessTag": "none",
    "nextAction": "continue",
    "masteryAchieved": false
  },
  "progressSnapshot": {
    "masteryPercentage": 60,
    "confidenceScore": 0.82
  }
}
```

**cycleSummary fields:**
- `accuracy`: Percentage (0-100) of correct answers in cycle
- `medianTime`: Median response time in cycle
- `weaknessTag`: "low_accuracy" | "slow_response" | "moderate_accuracy" | "none"
- `nextAction`: "remediate" | "continue" | "escalate"
- `masteryAchieved`: Boolean - true if accuracy ≥0.85 AND wrongCount ≤2 AND medianTime ≤ expectedSeconds

---

## C) CONFIDENCE SCORE CALCULATION

**Formula:**
```
confidenceScore = 0.7 × accuracyScore + 0.3 × speedScore

Where:
  accuracyScore = mean(accuracy) over last ≤20 activities
  speedScore = median(speedAttempt) where speedAttempt = clamp01(expectedSeconds / responseTime)
```

**Expected Response Times:**
- Easy: 40 seconds
- Medium: 70 seconds
- Hard: 110 seconds

**Properties:**
- Always in [0, 1]
- Rounded to 2 decimals
- Updated after each quiz attempt
- Stored in MasteryProfile.confidenceScore

---

## D) RESOURCE RECOMMENDATION ENDPOINTS

### GET /api/resources/recommendation
**Purpose:** Get curated learning resources for current session  
**Auth:** Required  
**Query Params:**
- `sessionId` (required): ID from session/start

**Request:**
```bash
GET http://localhost:5000/api/resources/recommendation?sessionId=678a1b2c3d4e5f6g7h8i9j0k
Authorization: Bearer <JWT>
```

**Response:**
```json
{
  "success": true,
  "resources": [
    {
      "label": "YouTube",
      "title": "Array basics",
      "url": "https://www.youtube.com/results?search_query=Array%20basics",
      "reasonCode": "topic_support"
    },
    {
      "label": "GeeksforGeeks",
      "title": "Array basics",
      "url": "https://www.geeksforgeeks.org/?s=Array%20basics",
      "reasonCode": "topic_support"
    },
    {
      "label": "YouTube",
      "title": "Array manipulation techniques",
      "url": "https://www.youtube.com/results?search_query=Array%20manipulation%20techniques",
      "reasonCode": "topic_support"
    },
    {
      "label": "GeeksforGeeks",
      "title": "Array manipulation techniques",
      "url": "https://www.geeksforgeeks.org/?s=Array%20manipulation%20techniques",
      "reasonCode": "topic_support"
    },
    {
      "label": "YouTube",
      "title": "Sorting algorithms",
      "url": "https://www.youtube.com/results?search_query=Sorting%20algorithms",
      "reasonCode": "topic_support"
    },
    {
      "label": "GeeksforGeeks",
      "title": "Sorting algorithms",
      "url": "https://www.geeksforgeeks.org/?s=Sorting%20algorithms",
      "reasonCode": "topic_support"
    }
  ]
}
```

**reasonCode:**
- `topic_support` - General topic support resources
- `weak_concept` - Resources for identified weak concepts

**For Python-ML subjects:**
Python Docs links are also included:
```json
{
  "label": "Python Docs",
  "title": "NumPy arrays",
  "url": "https://docs.python.org/3/search.html?q=NumPy%20arrays",
  "reasonCode": "topic_support"
}
```

---

### POST /api/resources/feedback (Optional)
**Purpose:** Provide feedback on resource usefulness  
**Auth:** Required  
**Body:**
```json
{
  "resourceLabel": "YouTube",
  "resourceTitle": "Array basics",
  "helpful": true
}
```

**Request:**
```bash
POST http://localhost:5000/api/resources/feedback
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "resourceLabel": "YouTube",
  "resourceTitle": "Array basics",
  "helpful": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback recorded"
}
```

---

## Complete Workflow Example

### Step 1: Get Available Subjects
```bash
GET http://localhost:5000/api/catalog/subjects
```

### Step 2: Get Topics for DSA
```bash
GET http://localhost:5000/api/catalog/topics?subject=dsa
```

### Step 3: Get Subtopics for Arrays
```bash
GET http://localhost:5000/api/catalog/subtopics?subject=dsa&topic=arrays
```

### Step 4: Start Learning Session
```bash
POST http://localhost:5000/api/learning/session/start
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "subject": "dsa",
  "topic": "arrays",
  "subtopic": "array-basics"
}
```
Response includes `sessionId`

### Step 5: Get First Question (Repeat until cycle complete)
```bash
GET http://localhost:5000/api/quiz/next?sessionId=<SESSION_ID>
Authorization: Bearer <JWT>
```

### Step 6: Submit Answer
```bash
POST http://localhost:5000/api/quiz/attempt
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "sessionId": "<SESSION_ID>",
  "questionId": "dsa-arr-1",
  "isCorrect": true,
  "responseTime": 35
}
```

After 5 attempts, response includes `cycleSummary`

### Step 7: Get Resources (Anytime)
```bash
GET http://localhost:5000/api/resources/recommendation?sessionId=<SESSION_ID>
Authorization: Bearer <JWT>
```

---

## Data Models

### LearningSession
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  subject: String,           // "dsa" or "python-ml"
  topic: String,             // "Arrays", "NumPy", etc.
  subtopic: String,          // Optional
  difficulty: String,        // "easy" | "medium" | "hard"
  status: String,            // "active" | "completed" | "paused"
  attemptCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### StudyActivity
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  subject: String,
  topic: String,
  subtopic: String,
  sessionId: ObjectId,       // Link to LearningSession
  expectedSeconds: Number,   // 40/70/110
  accuracy: Number,          // 0 or 1
  responseTime: Number,      // seconds
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### MasteryProfile
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  subject: String,
  masteryPercentage: Number, // 0-100
  confidenceScore: Number,   // 0-1
  overallLevel: String,      // "Beginner" | "Intermediate" | "Advanced"
  strongConcepts: [String],
  weakConcepts: [String],
  learningSpeed: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "sessionId required"
}
```

### 403 Forbidden (Auth Failed)
```json
{
  "success": false,
  "message": "Session not found or unauthorized"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Subject not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Failed to get next question"
}
```

---

## Testing with Hoppscotch/Postman

### 1. Create Collection
- Name: "AMEP Backend"

### 2. Add Requests

#### Catalog Requests (No Auth)
- GET /api/catalog/subjects
- GET /api/catalog/topics?subject=dsa
- GET /api/catalog/subtopics?subject=dsa&topic=arrays

#### Authenticated Requests
Add Header to all:
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

- POST /api/learning/session/start (body: subject, topic, subtopic)
- GET /api/quiz/next?sessionId=<ID>
- POST /api/quiz/attempt (body: sessionId, questionId, isCorrect, responseTime)
- GET /api/resources/recommendation?sessionId=<ID>

---

## Key Design Decisions

✅ **Deterministic Backend:** All routing/progression logic is deterministic  
✅ **Gemini for Titles Only:** Gemini provides resource titles; backend creates safe links  
✅ **No Manual Link Curation:** All links are generated from encoded titles  
✅ **Micro-Cycles:** 5 questions per cycle with summary every 5 attempts  
✅ **Mastery Rule:** accuracy ≥0.85 + wrongCount ≤2 + medianTime ≤ expectedSeconds  
✅ **Confidence Score:** 0.7 × accuracy + 0.3 × speed (deterministic)  
✅ **Safe URLs:** YouTube, GeeksforGeeks, Python Docs search queries only

---

## Status: ✅ READY FOR USE

All endpoints implemented, tested, and ready for frontend integration!
