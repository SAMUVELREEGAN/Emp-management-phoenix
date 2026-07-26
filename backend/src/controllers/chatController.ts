import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { getParam } from '../utils/helpers';
import * as chatService from '../services/chatService';
import { ChatMessageType } from '../types';

export const listGroups = asyncHandler(async (req: AuthRequest, res: Response) => {
  const groups = await chatService.listGroupsForUser(req.user!._id.toString());
  return sendSuccess(res, 'Chat groups fetched successfully', { groups });
});

export const listMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const members = await chatService.listEligibleMembers();
  return sendSuccess(res, 'Eligible chat members fetched successfully', { members });
});

export const createGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, memberIds, photo } = req.body as {
    name: string;
    memberIds: string[];
    photo?: string;
  };
  const group = await chatService.createGroup(req.user!._id.toString(), {
    name,
    memberIds,
    photo,
  });
  return sendSuccess(res, 'Chat group created successfully', { group }, 201);
});

export const updateGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const group = await chatService.updateGroup(
    req.user!._id.toString(),
    getParam(req.params.id),
    req.body,
  );
  return sendSuccess(res, 'Chat group updated successfully', { group });
});

export const deleteGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  await chatService.deleteGroup(req.user!._id.toString(), getParam(req.params.id));
  return sendSuccess(res, 'Chat group deleted successfully');
});

export const getGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const group = await chatService.getGroupById(
    getParam(req.params.id),
    req.user!._id.toString(),
  );
  return sendSuccess(res, 'Chat group fetched successfully', { group });
});

export const listMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 40;
  const result = await chatService.listMessages(
    getParam(req.params.id),
    req.user!._id.toString(),
    page,
    limit,
  );
  return sendSuccess(res, 'Messages fetched successfully', result);
});

export const sendTextMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content } = req.body as { content: string };
  const message = await chatService.sendMessage(
    getParam(req.params.id),
    req.user!._id.toString(),
    { content, messageType: 'text' },
  );
  return sendSuccess(res, 'Message sent successfully', { message }, 201);
});

export const sendAttachmentMessage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Attachment file is required',
        data: null,
      });
    }

    const { content, messageType, voiceDuration } = req.body as {
      content?: string;
      messageType?: ChatMessageType;
      voiceDuration?: string;
    };

    const resolvedType =
      messageType || chatService.resolveAttachmentMessageType(req.file.mimetype);

    const message = await chatService.sendMessage(
      getParam(req.params.id),
      req.user!._id.toString(),
      {
        content,
        messageType: resolvedType,
        attachmentUrl: `/uploads/${req.file.filename}`,
        attachmentName: req.file.originalname,
        attachmentMimeType: req.file.mimetype,
        voiceDuration: voiceDuration ? Number(voiceDuration) : undefined,
      },
    );

    return sendSuccess(res, 'Message sent successfully', { message }, 201);
  },
);

export const syncTeamChat = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const teamChat = await chatService.ensureTeamChat();
  return sendSuccess(res, 'Team chat synced successfully', { group: teamChat });
});

export const uploadChatAsset = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'File is required',
      data: null,
    });
  }
  return sendSuccess(res, 'File uploaded successfully', {
    url: `/uploads/${req.file.filename}`,
    name: req.file.originalname,
    mimeType: req.file.mimetype,
  });
});
