import User from "../models/User.js";
import Question from "../models/Question.js";
import { createAppError } from "../utils/createAppError.js";
import { attachAnswerCounts } from "./questionService.js";

// Save (bookmark) a question for a user. Idempotent via $addToSet.
export const saveQuestionService = async (questionId, userId) => {
  const question = await Question.findById(questionId);
  if (!question) {
    throw createAppError("Question not found", 404);
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: { savedQuestions: questionId },
  });

  return { questionId, isSaved: true };
};

// Remove a question from a user's saved set. Idempotent via $pull (no-op if absent).
export const unsaveQuestionService = async (questionId, userId) => {
  await User.findByIdAndUpdate(userId, {
    $pull: { savedQuestions: questionId },
  });

  return { questionId, isSaved: false };
};

// Return the user's saved questions shaped like the feed (author, tags, answerCount)
// so the existing QuestionList UI renders them unchanged. Mirrors getAllQuestionsService.
export const getSavedQuestionsService = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "savedQuestions",
    populate: [
      { path: "author", select: "name" },
      { path: "tags" },
    ],
  });

  if (!user) {
    throw createAppError("User not found", 404);
  }

  // Drop any nulls left by deleted questions, then shape like the feed
  // (author/tags already populated above) via the shared helper.
  const savedQuestions = (user.savedQuestions || []).filter(Boolean);

  return attachAnswerCounts(savedQuestions);
};
