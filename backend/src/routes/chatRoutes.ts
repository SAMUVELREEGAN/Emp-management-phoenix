import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { chatUpload } from '../middleware/chatUpload';
import {
  chatMessageUploadSchema,
  createChatGroupSchema,
  paginationSchema,
  sendChatMessageSchema,
  updateChatGroupSchema,
} from '../validators/schemas';
import * as chatController from '../controllers/chatController';

const router = Router();

router.use(authenticate);

router.post('/upload', chatUpload, chatController.uploadChatAsset);
router.get('/groups', chatController.listGroups);
router.get('/members', authorize('admin'), chatController.listMembers);
router.post('/groups', authorize('admin'), validate(createChatGroupSchema), chatController.createGroup);
router.get('/groups/:id', chatController.getGroup);
router.put(
  '/groups/:id',
  authorize('admin'),
  validate(updateChatGroupSchema),
  chatController.updateGroup,
);
router.delete('/groups/:id', authorize('admin'), chatController.deleteGroup);
router.post('/team/sync', authorize('admin'), chatController.syncTeamChat);

router.get(
  '/groups/:id/messages',
  validate(paginationSchema, 'query'),
  chatController.listMessages,
);
router.post(
  '/groups/:id/messages',
  validate(sendChatMessageSchema),
  chatController.sendTextMessage,
);
router.post(
  '/groups/:id/messages/upload',
  chatUpload,
  validate(chatMessageUploadSchema),
  chatController.sendAttachmentMessage,
);

export default router;
