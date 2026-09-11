import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as assistantService from '../services/assistantService';
import type { AssistantQuestionId } from '../services/assistantService';

export const getQuestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const questions = assistantService.getAssistantQuestions(req.user!.role);
  const category = req.user!.role === 'employee' ? 'employee' : 'hr';

  return sendSuccess(res, 'Assistant questions fetched successfully', {
    category,
    questions,
  });
});

export const askQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { questionId } = req.body as { questionId: AssistantQuestionId };
  const result = await assistantService.askAssistant(
    req.user!._id.toString(),
    req.user!.role,
    questionId,
  );

  return sendSuccess(res, 'Assistant answer generated successfully', result);
});
