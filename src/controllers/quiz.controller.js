/**
 * Quiz Controller - Quiz engine with micro-cycles
 */

import LearningSession from "../models/LearningSession.js";
import MasteryProfile from "../models/MasteryProfile.js";
import StudyActivity from "../models/StudyActivity.js";
import { validatePath } from "../data/catalog.js";
import { computeConfidence } from "../utils/confidence.js";

/**
 * Slugify helper: converts "Trees" -> "trees", "Linked List" -> "linked-list"
 */
const slugify = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
};

// Simple in-code question bank per (subject, topic)
const questionBank = {
  "dsa-arrays": [
    {
      questionId: "dsa-arr-1",
      prompt: "What is the time complexity of accessing an element by index in an array?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      correctIndex: 0,
      difficulty: "easy"
    },
    {
      questionId: "dsa-arr-2",
      prompt: "Which of the following sorting algorithms has the best average time complexity?",
      options: ["Bubble Sort", "Quick Sort", "Selection Sort", "Insertion Sort"],
      correctIndex: 1,
      difficulty: "medium"
    },
    {
      questionId: "dsa-arr-3",
      prompt: "In the two-pointer technique for a sorted array, what's the initial setup?",
      options: ["Both at start", "One at start, one at end", "Both at middle", "Random positions"],
      correctIndex: 1,
      difficulty: "medium"
    },
    {
      questionId: "dsa-arr-4",
      prompt: "What is the space complexity of merge sort?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
      correctIndex: 2,
      difficulty: "hard"
    },
    {
      questionId: "dsa-arr-5",
      prompt: "Which algorithm is best for nearly sorted arrays?",
      options: ["Bubble Sort", "Quick Sort", "Insertion Sort", "Merge Sort"],
      correctIndex: 2,
      difficulty: "medium"
    }
  ],
  "dsa-linked-list": [
    {
      questionId: "dsa-ll-1",
      prompt: "Time complexity to insert at the beginning of a singly linked list?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      correctIndex: 0,
      difficulty: "easy"
    },
    {
      questionId: "dsa-ll-2",
      prompt: "How do you reverse a singly linked list in-place?",
      options: ["Use a stack", "Use three pointers", "Create a new list", "Sort and rebuild"],
      correctIndex: 1,
      difficulty: "hard"
    },
    {
      questionId: "dsa-ll-3",
      prompt: "What is a circular linked list?",
      options: ["Last node points to first", "Nodes form a circle", "Head and tail same", "All above"],
      correctIndex: 3,
      difficulty: "medium"
    },
    {
      questionId: "dsa-ll-4",
      prompt: "Difference between singly and doubly linked list?",
      options: ["Doubly has 2 pointers", "Speed difference", "Memory difference", "Both A and C"],
      correctIndex: 3,
      difficulty: "medium"
    },
    {
      questionId: "dsa-ll-5",
      prompt: "Time complexity to find middle of linked list using slow-fast pointer?",
      options: ["O(1)", "O(n/2)", "O(n)", "O(n log n)"],
      correctIndex: 2,
      difficulty: "medium"
    }
  ],
  "dsa-trees": [
    {
      questionId: "dsa-tree-1",
      prompt: "What is the height of a binary tree with only root node?",
      options: ["0", "1", "-1", "Undefined"],
      correctIndex: 0,
      difficulty: "easy"
    },
    {
      questionId: "dsa-tree-2",
      prompt: "Which tree traversal visits nodes in sorted order for BST?",
      options: ["Preorder", "Inorder", "Postorder", "Level order"],
      correctIndex: 1,
      difficulty: "medium"
    },
    {
      questionId: "dsa-tree-3",
      prompt: "What property defines a Binary Search Tree?",
      options: ["Left < Root < Right", "All leaves same level", "Balanced always", "Complete tree"],
      correctIndex: 0,
      difficulty: "medium"
    },
    {
      questionId: "dsa-tree-4",
      prompt: "Time complexity of search in balanced BST?",
      options: ["O(n)", "O(log n)", "O(n log n)", "O(n^2)"],
      correctIndex: 1,
      difficulty: "medium"
    },
    {
      questionId: "dsa-tree-5",
      prompt: "What is the main difference between AVL and Red-Black trees?",
      options: ["Balancing factor", "Color properties", "Complexity guarantees", "All are similar"],
      correctIndex: 0,
      difficulty: "hard"
    }
  ],
  "dsa-graphs": [
    {
      questionId: "dsa-graph-1",
      prompt: "What data structure is used to implement BFS?",
      options: ["Stack", "Queue", "Heap", "Tree"],
      correctIndex: 1,
      difficulty: "easy"
    },
    {
      questionId: "dsa-graph-2",
      prompt: "What is the time complexity of DFS?",
      options: ["O(V)", "O(E)", "O(V+E)", "O(V*E)"],
      correctIndex: 2,
      difficulty: "medium"
    },
    {
      questionId: "dsa-graph-3",
      prompt: "Which algorithm finds shortest path in weighted graph?",
      options: ["DFS", "BFS", "Dijkstra", "Floyd-Warshall"],
      correctIndex: 2,
      difficulty: "medium"
    },
    {
      questionId: "dsa-graph-4",
      prompt: "Can Dijkstra work with negative edge weights?",
      options: ["Yes", "No", "Only if no cycle", "Only positive cycles"],
      correctIndex: 1,
      difficulty: "hard"
    },
    {
      questionId: "dsa-graph-5",
      prompt: "What does topological sort do?",
      options: ["Sorts by weight", "Orders for DAG", "Sorts vertices", "Finds cycles"],
      correctIndex: 1,
      difficulty: "hard"
    }
  ],
  "python-ml-numpy": [
    {
      questionId: "py-np-1",
      prompt: "How do you create a NumPy array from a Python list?",
      options: ["np.array(list)", "np.create(list)", "np.make(list)", "np.build(list)"],
      correctIndex: 0,
      difficulty: "easy"
    },
    {
      questionId: "py-np-2",
      prompt: "What is broadcasting in NumPy?",
      options: ["Casting to bool", "Operating on different shapes", "Network feature", "Data transfer"],
      correctIndex: 1,
      difficulty: "medium"
    },
    {
      questionId: "py-np-3",
      prompt: "What does np.reshape do?",
      options: ["Changes values", "Changes array shape", "Changes data type", "Creates copy"],
      correctIndex: 1,
      difficulty: "easy"
    },
    {
      questionId: "py-np-4",
      prompt: "Time complexity of NumPy array indexing?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      correctIndex: 0,
      difficulty: "medium"
    },
    {
      questionId: "py-np-5",
      prompt: "What is the dtype of NumPy array?",
      options: ["Data type", "Python type", "Array length", "Shape info"],
      correctIndex: 0,
      difficulty: "easy"
    }
  ],
  "python-ml-pandas": [
    {
      questionId: "py-pd-1",
      prompt: "What is a DataFrame in Pandas?",
      options: ["2D array", "Table structure", "Dictionary", "List of lists"],
      correctIndex: 1,
      difficulty: "easy"
    },
    {
      questionId: "py-pd-2",
      prompt: "How do you select a column from a DataFrame?",
      options: ["df[col]", "df.col", "df.get(col)", "All work"],
      correctIndex: 3,
      difficulty: "easy"
    },
    {
      questionId: "py-pd-3",
      prompt: "What does df.fillna() do?",
      options: ["Fills empty values", "Removes NaN", "Creates NaN", "Validates data"],
      correctIndex: 0,
      difficulty: "medium"
    },
    {
      questionId: "py-pd-4",
      prompt: "What is the result of df.groupby()?",
      options: ["DataFrame", "GroupBy object", "Dictionary", "List"],
      correctIndex: 1,
      difficulty: "medium"
    },
    {
      questionId: "py-pd-5",
      prompt: "How to merge two DataFrames?",
      options: ["df.merge()", "pd.merge()", "df.join()", "All work"],
      correctIndex: 3,
      difficulty: "medium"
    }
  ],
  // Subtopic-level questions (e.g., Trees -> Traversals)
  "dsa-trees-traversals": [
    {
      questionId: "dsa-tree-trav-1",
      prompt: "In-order traversal visits nodes in what order for a BST?",
      options: ["Ascending", "Descending", "Random", "Level order"],
      correctIndex: 0,
      difficulty: "medium"
    },
    {
      questionId: "dsa-tree-trav-2",
      prompt: "Pre-order traversal processes nodes before or after children?",
      options: ["Before children", "After children", "During", "Random"],
      correctIndex: 0,
      difficulty: "medium"
    },
    {
      questionId: "dsa-tree-trav-3",
      prompt: "Level-order traversal is also called?",
      options: ["DFS", "BFS", "Post-order", "Pre-order"],
      correctIndex: 1,
      difficulty: "easy"
    }
  ]
};

/**
 * GET /api/quiz/next?sessionId=...
 * Returns next question in micro-cycle
 */
export const getNextQuestion = async (req, res) => {
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

    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Session is not active"
      });
    }

    // Defensive check: topic is required
    if (!session.topic) {
      return res.status(400).json({
        success: false,
        message: "Session topic is missing"
      });
    }

    // Build question bank keys with fallback logic using slugify
    const subjectSlug = slugify(session.subject);
    const topicSlug = slugify(session.topic);
    const subtopicSlug = session.subtopic ? slugify(session.subtopic) : null;

    const baseKey = `${subjectSlug}-${topicSlug}`;
    const subKey = subtopicSlug ? `${baseKey}-${subtopicSlug}` : null;

    // Try subtopic-level questions first, then topic-level, then empty
    let questions = [];
    if (subKey && questionBank[subKey]) {
      questions = questionBank[subKey];
    } else if (questionBank[baseKey]) {
      questions = questionBank[baseKey];
    }

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found for ${baseKey}${subKey ? " or " + subKey : ""}`
      });
    }

    // Track cycle position (1-5 per cycle)
    const cycleIndex = Math.floor((session.attemptCount || 0) / 5);
    const positionInCycle = ((session.attemptCount || 0) % 5) + 1;

    // Deterministic question selection based on attempt count
    const questionIndex = (session.attemptCount || 0) % questions.length;
    const selectedQuestion = questions[questionIndex];

    // Determine reasonCode based on position/pattern
    let reasonCode = "baseline_check";
    const attempts = (session.attemptCount || 0);

    if (attempts < 2) {
      reasonCode = "baseline_check";
    } else if (attempts === 2) {
      reasonCode = "fluency_drill";
    } else if (attempts === 3) {
      reasonCode = "edge_case_check";
    } else if (attempts >= 4) {
      reasonCode = "slow_response"; // hypothetical: could be based on speed from StudyActivity
    }

    res.status(200).json({
      success: true,
      question: {
        questionId: selectedQuestion.questionId,
        prompt: selectedQuestion.prompt,
        options: selectedQuestion.options,
        difficultyTag: selectedQuestion.difficulty
      },
      reasonCode,
      cycle: {
        index: cycleIndex,
        position: positionInCycle,
        total: 5
      }
    });

  } catch (error) {
    console.error("Get next question error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get next question"
    });
  }
};

/**
 * POST /api/quiz/attempt
 * Submit answer and update mastery
 */
export const submitAttempt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, questionId, isCorrect, responseTime } = req.body;

    if (!sessionId || typeof isCorrect !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "sessionId and isCorrect required"
      });
    }

    const session = await LearningSession.findById(sessionId);
    if (!session || session.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Session not found or unauthorized"
      });
    }

    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Session is not active"
      });
    }

    // Fetch mastery profile
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

    // Determine expectedSeconds based on difficulty (with defensive default)
    const difficultyMap = {
      easy: 40,
      medium: 70,
      hard: 110
    };
    const expectedSeconds = difficultyMap[session.difficulty] || difficultyMap["medium"];

    // Log StudyActivity
    const activity = await StudyActivity.create({
      userId,
      subject: session.subject,
      topic: session.topic,
      subtopic: session.subtopic,
      expectedSeconds,
      accuracy: isCorrect ? 1 : 0,
      responseTime: responseTime || 0,
      sessionId: session._id
    });

    // Update session attempt count
    session.attemptCount = (session.attemptCount || 0) + 1;
    await session.save();

    // Fetch recent activities for confidence calculation
    const recentActivities = await StudyActivity.find({
      userId,
      subject: session.subject,
      ...(session.topic && { topic: session.topic })
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('accuracy responseTime expectedSeconds');

    // Compute new confidence
    const confidenceResult = computeConfidence({
      activities: recentActivities
    });

    // Update mastery profile
    if (isCorrect) {
      masteryProfile.masteryPercentage = Math.min(
        masteryProfile.masteryPercentage + 2,
        100
      );
    } else {
      // Slight penalty
      masteryProfile.masteryPercentage = Math.max(
        masteryProfile.masteryPercentage - 1,
        0
      );
    }

    masteryProfile.confidenceScore = confidenceResult.confidence;
    await masteryProfile.save();

    // Check if cycle complete (every 5 attempts)
    const isCycleComplete = session.attemptCount % 5 === 0;

    // Prepare response
    const response = {
      success: true,
      feedback: isCorrect
        ? "Correct! Great work."
        : "Incorrect. Review the concept and try again.",
      masteryPercentage: masteryProfile.masteryPercentage,
      confidenceScore: masteryProfile.confidenceScore,
      attemptCount: session.attemptCount
    };

    // If cycle complete, include cycle summary
    if (isCycleComplete) {
      // Fetch last 5 activities
      const last5 = await StudyActivity.find({
        userId,
        subject: session.subject
      })
        .sort({ timestamp: -1 })
        .limit(5)
        .select('accuracy responseTime');

      const cycleAccuracy = last5.filter(a => a.accuracy === 1).length / 5;
      const wrongCount = 5 - (last5.filter(a => a.accuracy === 1).length);
      const responseTimes = last5.map(a => a.responseTime).sort((a, b) => a - b);
      const medianTime = responseTimes[Math.floor(responseTimes.length / 2)];

      // Mastery rule: accuracy >= 0.85 AND wrongCount <= 2 AND median <= expectedSeconds
      const masteryAchieved =
        cycleAccuracy >= 0.85 &&
        wrongCount <= 2 &&
        medianTime <= expectedSeconds;

      let weaknessTag = "none";
      if (cycleAccuracy < 0.7) weaknessTag = "low_accuracy";
      else if (medianTime > expectedSeconds * 1.5) weaknessTag = "slow_response";
      else if (cycleAccuracy < 0.85) weaknessTag = "moderate_accuracy";

      const nextAction = masteryAchieved
        ? "continue"
        : wrongCount > 2
        ? "remediate"
        : "continue";

      response.cycleSummary = {
        accuracy: Math.round(cycleAccuracy * 100),
        medianTime,
        weaknessTag,
        nextAction,
        masteryAchieved
      };

      response.progressSnapshot = {
        masteryPercentage: masteryProfile.masteryPercentage,
        confidenceScore: masteryProfile.confidenceScore
      };
    }

    res.status(200).json(response);

  } catch (error) {
    console.error("Submit attempt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit attempt"
    });
  }
};
