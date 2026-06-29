import {
  saveQuestionService,
  unsaveQuestionService,
  getSavedQuestionsService,
} from "../services/bookmarkService.js";

export const saveQuestion = async (req, res) => {
  const { id } = req.params;
  const data = await saveQuestionService(id, req.user.id);

  res.status(200).json({
    success: true,
    message: "Question saved successfully",
    data,
  });
};

export const unsaveQuestion = async (req, res) => {
  const { id } = req.params;
  const data = await unsaveQuestionService(id, req.user.id);

  res.status(200).json({
    success: true,
    message: "Question unsaved successfully",
    data,
  });
};

export const getSavedQuestions = async (req, res) => {
  const data = await getSavedQuestionsService(req.user.id);

  res.status(200).json({
    success: true,
    message: "Saved questions fetched successfully",
    data,
  });
};
