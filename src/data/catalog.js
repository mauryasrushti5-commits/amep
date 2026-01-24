/**
 * Topic Catalog - Source of Truth for Subjects, Topics, Subtopics
 * Covers: DSA and Python-ML with standard curriculum coverage
 */

export const catalog = {
  subjects: [
    {
      id: "dsa",
      name: "DSA",
      description: "Data Structures and Algorithms for Engineering",
      topics: [
        {
          id: "arrays",
          name: "Arrays",
          subtopics: [
            { id: "array-basics", name: "Array Basics" },
            { id: "array-manipulation", name: "Array Manipulation" },
            { id: "searching", name: "Searching (Linear, Binary)" },
            { id: "sorting", name: "Sorting Algorithms" },
            { id: "two-pointers", name: "Two Pointers Technique" },
            { id: "sliding-window", name: "Sliding Window" }
          ]
        },
        {
          id: "strings",
          name: "Strings",
          subtopics: [
            { id: "string-basics", name: "String Basics" },
            { id: "pattern-matching", name: "Pattern Matching" },
            { id: "anagrams-palindromes", name: "Anagrams & Palindromes" },
            { id: "string-manipulation", name: "String Manipulation" }
          ]
        },
        {
          id: "linked-list",
          name: "Linked List",
          subtopics: [
            { id: "singly-linked-list", name: "Singly Linked List" },
            { id: "doubly-linked-list", name: "Doubly Linked List" },
            { id: "circular-linked-list", name: "Circular Linked List" },
            { id: "linked-list-operations", name: "Insert/Delete/Reverse" }
          ]
        },
        {
          id: "stacks-queues",
          name: "Stacks & Queues",
          subtopics: [
            { id: "stack-basics", name: "Stack Basics" },
            { id: "queue-basics", name: "Queue Basics" },
            { id: "deque", name: "Deque (Double-ended Queue)" },
            { id: "priority-queue", name: "Priority Queue" }
          ]
        },
        {
          id: "trees",
          name: "Trees",
          subtopics: [
            { id: "binary-tree", name: "Binary Tree" },
            { id: "binary-search-tree", name: "Binary Search Tree (BST)" },
            { id: "tree-traversal", name: "Tree Traversal (Inorder, Preorder, Postorder)" },
            { id: "balanced-trees", name: "Balanced Trees (AVL, Red-Black)" },
            { id: "heap", name: "Heap (Min Heap, Max Heap)" }
          ]
        },
        {
          id: "graphs",
          name: "Graphs",
          subtopics: [
            { id: "graph-basics", name: "Graph Basics & Representation" },
            { id: "bfs-dfs", name: "BFS & DFS" },
            { id: "shortest-path", name: "Shortest Path (Dijkstra, Bellman-Ford)" },
            { id: "minimum-spanning-tree", name: "Minimum Spanning Tree" },
            { id: "topological-sort", name: "Topological Sorting" }
          ]
        },
        {
          id: "hashing",
          name: "Hashing",
          subtopics: [
            { id: "hash-tables", name: "Hash Tables & Hash Functions" },
            { id: "collision-resolution", name: "Collision Resolution" },
            { id: "hash-set", name: "Hash Set" },
            { id: "hash-map", name: "Hash Map" }
          ]
        },
        {
          id: "dynamic-programming",
          name: "Dynamic Programming",
          subtopics: [
            { id: "dp-basics", name: "DP Basics (Memoization & Tabulation)" },
            { id: "knapsack", name: "Knapsack Problem" },
            { id: "longest-subsequence", name: "Longest Common Subsequence/Substring" },
            { id: "matrix-chain", name: "Matrix Chain Multiplication" },
            { id: "dp-optimization", name: "DP Optimization Techniques" }
          ]
        },
        {
          id: "greedy",
          name: "Greedy Algorithms",
          subtopics: [
            { id: "greedy-basics", name: "Greedy Strategy" },
            { id: "activity-selection", name: "Activity Selection" },
            { id: "huffman-coding", name: "Huffman Coding" },
            { id: "fractional-knapsack", name: "Fractional Knapsack" }
          ]
        },
        {
          id: "backtracking",
          name: "Backtracking",
          subtopics: [
            { id: "backtracking-basics", name: "Backtracking Basics" },
            { id: "n-queens", name: "N-Queens Problem" },
            { id: "sudoku-solver", name: "Sudoku Solver" },
            { id: "permutations-combinations", name: "Permutations & Combinations" }
          ]
        }
      ]
    },
    {
      id: "python-ml",
      name: "Python-ML",
      description: "Python for Machine Learning",
      topics: [
        {
          id: "python-basics",
          name: "Python Basics",
          subtopics: [
            { id: "variables-types", name: "Variables & Data Types" },
            { id: "control-flow", name: "Control Flow (if, loops)" },
            { id: "functions", name: "Functions & Scope" },
            { id: "object-oriented-python", name: "Object-Oriented Programming in Python" }
          ]
        },
        {
          id: "numpy",
          name: "NumPy",
          subtopics: [
            { id: "numpy-arrays", name: "NumPy Arrays & Creation" },
            { id: "array-operations", name: "Array Operations & Broadcasting" },
            { id: "indexing-slicing", name: "Indexing & Slicing" },
            { id: "numpy-functions", name: "Mathematical Functions" }
          ]
        },
        {
          id: "pandas",
          name: "Pandas",
          subtopics: [
            { id: "dataframe-basics", name: "DataFrame Basics" },
            { id: "data-cleaning", name: "Data Cleaning & Preprocessing" },
            { id: "data-selection", name: "Data Selection & Filtering" },
            { id: "groupby-aggregation", name: "GroupBy & Aggregation" },
            { id: "merging-joining", name: "Merging & Joining DataFrames" }
          ]
        },
        {
          id: "matplotlib-seaborn",
          name: "Matplotlib & Seaborn",
          subtopics: [
            { id: "matplotlib-basics", name: "Matplotlib Basics" },
            { id: "plot-types", name: "Plot Types (scatter, bar, histogram)" },
            { id: "seaborn-visualization", name: "Seaborn for Statistical Plots" },
            { id: "customization", name: "Plot Customization" }
          ]
        },
        {
          id: "scikit-learn",
          name: "Scikit-Learn",
          subtopics: [
            { id: "ml-basics", name: "Machine Learning Basics" },
            { id: "supervised-learning", name: "Supervised Learning (Classification, Regression)" },
            { id: "unsupervised-learning", name: "Unsupervised Learning (Clustering)" },
            { id: "model-evaluation", name: "Model Evaluation & Metrics" },
            { id: "hyperparameter-tuning", name: "Hyperparameter Tuning" }
          ]
        },
        {
          id: "regression",
          name: "Regression",
          subtopics: [
            { id: "linear-regression", name: "Linear Regression" },
            { id: "polynomial-regression", name: "Polynomial Regression" },
            { id: "logistic-regression", name: "Logistic Regression" },
            { id: "regularization", name: "Regularization (Ridge, Lasso)" }
          ]
        },
        {
          id: "classification",
          name: "Classification",
          subtopics: [
            { id: "classification-basics", name: "Classification Basics" },
            { id: "decision-trees", name: "Decision Trees" },
            { id: "random-forest", name: "Random Forest" },
            { id: "svm", name: "Support Vector Machine (SVM)" },
            { id: "naive-bayes", name: "Naive Bayes" }
          ]
        },
        {
          id: "clustering",
          name: "Clustering",
          subtopics: [
            { id: "kmeans", name: "K-Means Clustering" },
            { id: "hierarchical-clustering", name: "Hierarchical Clustering" },
            { id: "dbscan", name: "DBSCAN" },
            { id: "clustering-evaluation", name: "Clustering Evaluation" }
          ]
        },
        {
          id: "feature-engineering",
          name: "Feature Engineering",
          subtopics: [
            { id: "feature-scaling", name: "Feature Scaling & Normalization" },
            { id: "feature-selection", name: "Feature Selection" },
            { id: "dimensionality-reduction", name: "Dimensionality Reduction (PCA)" },
            { id: "feature-creation", name: "Feature Creation & Transformation" }
          ]
        },
        {
          id: "neural-networks",
          name: "Neural Networks Intro",
          subtopics: [
            { id: "nn-basics", name: "Neural Network Basics" },
            { id: "activation-functions", name: "Activation Functions" },
            { id: "backpropagation", name: "Backpropagation" },
            { id: "deep-learning-intro", name: "Introduction to Deep Learning" }
          ]
        }
      ]
    }
  ]
};

/**
 * Helper: Get subject by ID or name
 */
export function getSubject(identifier) {
  return catalog.subjects.find(
    s => s.id === identifier || s.name === identifier
  );
}

/**
 * Helper: Get topic within a subject
 */
export function getTopic(subjectId, topicId) {
  const subject = getSubject(subjectId);
  if (!subject) return null;
  return subject.topics.find(t => t.id === topicId || t.name === topicId);
}

/**
 * Helper: Get subtopic within a topic
 */
export function getSubtopic(subjectId, topicId, subtopicId) {
  const topic = getTopic(subjectId, topicId);
  if (!topic) return null;
  return topic.subtopics.find(
    st => st.id === subtopicId || st.name === subtopicId
  );
}

/**
 * Helper: Validate subject + topic + subtopic path
 */
export function validatePath(subject, topic, subtopic = null) {
  const subj = getSubject(subject);
  if (!subj) return { valid: false, error: "Subject not found" };

  const top = getTopic(subj.id, topic);
  if (!top) return { valid: false, error: "Topic not found" };

  if (subtopic) {
    const subt = getSubtopic(subj.id, top.id, subtopic);
    if (!subt) return { valid: false, error: "Subtopic not found" };
    return { valid: true, subject: subj, topic: top, subtopic: subt };
  }

  return { valid: true, subject: subj, topic: top, subtopic: null };
}

/**
 * Helper: Get all subjects
 */
export function getAllSubjects() {
  return catalog.subjects.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    topicCount: s.topics.length
  }));
}

/**
 * Helper: Get all topics for a subject
 */
export function getTopicsForSubject(subjectId) {
  const subject = getSubject(subjectId);
  if (!subject) return null;
  return subject.topics.map(t => ({
    id: t.id,
    name: t.name,
    subtopicCount: t.subtopics.length
  }));
}

/**
 * Helper: Get all subtopics for a topic
 */
export function getSubtopicsForTopic(subjectId, topicId) {
  const topic = getTopic(subjectId, topicId);
  if (!topic) return null;
  return topic.subtopics.map(st => ({
    id: st.id,
    name: st.name
  }));
}
