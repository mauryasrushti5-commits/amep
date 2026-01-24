/**
 * Catalog Controller - Subject/Topic/Subtopic endpoints
 */

import {
  getAllSubjects,
  getTopicsForSubject,
  getSubtopicsForTopic,
  validatePath
} from "../data/catalog.js";

/**
 * GET /api/catalog/subjects
 * Returns all subjects
 */
export const getSubjects = async (req, res) => {
  try {
    const subjects = getAllSubjects();
    res.status(200).json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects"
    });
  }
};

/**
 * GET /api/catalog/topics?subject=DSA
 * Returns topics for a subject
 */
export const getTopics = async (req, res) => {
  try {
    const { subject } = req.query;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Subject parameter required"
      });
    }

    const topics = getTopicsForSubject(subject);
    if (!topics) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.status(200).json({
      success: true,
      data: topics
    });
  } catch (error) {
    console.error("Get topics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch topics"
    });
  }
};

/**
 * GET /api/catalog/subtopics?subject=DSA&topic=Arrays
 * Returns subtopics for a topic
 */
export const getSubtopics = async (req, res) => {
  try {
    const { subject, topic } = req.query;

    if (!subject || !topic) {
      return res.status(400).json({
        success: false,
        message: "Subject and topic parameters required"
      });
    }

    const subtopics = getSubtopicsForTopic(subject, topic);
    if (!subtopics) {
      return res.status(404).json({
        success: false,
        message: "Topic not found"
      });
    }

    res.status(200).json({
      success: true,
      data: subtopics
    });
  } catch (error) {
    console.error("Get subtopics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subtopics"
    });
  }
};

/**
 * GET /api/catalog/validate?subject=DSA&topic=Arrays&subtopic=array-basics
 * Validates if a path exists (optional helper)
 */
export const validateCatalogPath = async (req, res) => {
  try {
    const { subject, topic, subtopic } = req.query;

    if (!subject || !topic) {
      return res.status(400).json({
        success: false,
        message: "Subject and topic required"
      });
    }

    const validation = validatePath(subject, topic, subtopic);

    if (!validation.valid) {
      return res.status(404).json({
        success: false,
        message: validation.error
      });
    }

    res.status(200).json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error("Validate catalog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate catalog path"
    });
  }
};
