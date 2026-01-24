/**
 * Catalog Routes
 */

import express from "express";
import {
  getSubjects,
  getTopics,
  getSubtopics,
  validateCatalogPath
} from "../controllers/catalog.controller.js";

const router = express.Router();

// GET /api/catalog/subjects
router.get("/subjects", getSubjects);

// GET /api/catalog/topics?subject=DSA
router.get("/topics", getTopics);

// GET /api/catalog/subtopics?subject=DSA&topic=Arrays
router.get("/subtopics", getSubtopics);

// GET /api/catalog/validate?subject=DSA&topic=Arrays&subtopic=array-basics
router.get("/validate", validateCatalogPath);

export default router;
