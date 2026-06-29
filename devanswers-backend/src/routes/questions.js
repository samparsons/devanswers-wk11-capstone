import express from "express";

import {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  upvoteQuestion,
  downvoteQuestion,
  improveQuestion,
} from "../controllers/questionController.js";
import {
  getAnswersByQuestionId,
  createAnswer,
} from "../controllers/answerController.js";
import {
  saveQuestion,
  unsaveQuestion,
  getSavedQuestions,
} from "../controllers/bookmarkController.js";
import authenticate from "../middleware/authHandler.js";

const router = express.Router();

// Saved questions for the logged-in user.
// MUST be declared before "/:id" or Express captures "saved" as an :id.
router.get("/saved", authenticate, getSavedQuestions);

// Public routes - no authentication required
router.get("/", getAllQuestions);
router.get("/:id", getQuestionById);
router.get("/:questionId/answers", getAnswersByQuestionId);

// Protected routes - authentication required
router.post("/improve", authenticate, improveQuestion);
router.post("/:id/save", authenticate, saveQuestion);
router.delete("/:id/save", authenticate, unsaveQuestion);
router.post("/", authenticate, createQuestion);
router.put("/:id", authenticate, updateQuestion);
router.delete("/:id", authenticate, deleteQuestion);
router.post("/:id/upvote", authenticate, upvoteQuestion);
router.post("/:id/downvote", authenticate, downvoteQuestion);
router.post("/:questionId/answers", authenticate, createAnswer);

export default router;
