import { Types } from 'mongoose';
import { ChatGroup, IChatGroup } from '../models/ChatGroup';
import { ChatMessage } from '../models/ChatMessage';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { ChatMessageType } from '../types';
import { createNotificationsForUsers } from './notificationService';

const TEAM_CHAT_NAME = 'Team Chat';

function reachableStaffFilter() {
  return {
    $or: [
      { status: 'active' },
      { status: 'inactive', isVerified: false },
    ],
  };
}

async function getReachableStaffIds(): Promise<Types.ObjectId[]> {
  const users = await User.find({
    role: { $in: ['admin', 'employee', 'hr'] },
    ...reachableStaffFilter(),
  }).select('_id');
  return users.map(user => user._id);
}

export async function ensureTeamChat(): Promise<IChatGroup> {
  const admin = await User.findOne({ role: 'admin' }).select('_id');
  if (!admin) {
    throw ApiError.internal('No admin account found for team chat');
  }

  let teamChat = await ChatGroup.findOne({ type: 'team' });

  const staffIds = await getReachableStaffIds();
  const memberSet = new Set(staffIds.map(id => id.toString()));
  memberSet.add(admin._id.toString());
  const members = Array.from(memberSet).map(id => new Types.ObjectId(id));

  if (!teamChat) {
    teamChat = await ChatGroup.create({
      name: TEAM_CHAT_NAME,
      type: 'team',
      members,
      createdBy: admin._id,
    });
    return teamChat;
  }

  teamChat.members = members;
  if (!teamChat.name) {
    teamChat.name = TEAM_CHAT_NAME;
  }
  await teamChat.save();
  return teamChat;
}

async function assertGroupAccess(group: IChatGroup, userId: Types.ObjectId): Promise<void> {
  const isMember = group.members.some(memberId => memberId.equals(userId));
  if (!isMember) {
    throw ApiError.forbidden('You are not a member of this chat');
  }
}

function buildMessagePreview(messageType: ChatMessageType, content?: string): string {
  switch (messageType) {
    case 'text':
      return content?.trim() || 'Message';
    case 'image':
      return content?.trim() ? `Photo: ${content.trim()}` : 'Photo';
    case 'file':
      return content?.trim() ? `File: ${content.trim()}` : 'Attachment';
    case 'voice':
      return 'Voice message';
    default:
      return 'Message';
  }
}

async function notifyChatMembers(
  group: IChatGroup,
  senderId: Types.ObjectId,
  preview: string,
): Promise<void> {
  const recipientIds = group.members.filter(memberId => !memberId.equals(senderId));
  if (!recipientIds.length) {
    return;
  }

  const sender = await User.findById(senderId).select('fullName');
  const senderName = sender?.fullName || 'Someone';

  await createNotificationsForUsers(recipientIds, {
    title: group.name,
    message: `${senderName}: ${preview}`,
    type: 'chat',
    relatedId: group._id,
  });
}

export const listGroupsForUser = async (userId: string) => {
  await ensureTeamChat();

  const userObjectId = new Types.ObjectId(userId);

  const groups = await ChatGroup.find({ members: userObjectId })
    .sort({ type: 1, lastMessageAt: -1, updatedAt: -1 })
    .populate('lastMessageSender', 'fullName')
    .lean();

  return groups.map(group => ({
    ...group,
    memberCount: group.members.length,
    isTeamChat: group.type === 'team',
  }));
};

export const listEligibleMembers = async () => {
  const users = await User.find({
    role: { $in: ['employee', 'hr'] },
    ...reachableStaffFilter(),
  })
    .select('fullName employeeId department designation role profilePhoto status')
    .sort({ fullName: 1 });

  return users;
};

interface CreateGroupInput {
  name: string;
  memberIds: string[];
  photo?: string;
}

export const createGroup = async (
  adminId: string,
  input: CreateGroupInput,
) => {
  const adminObjectId = new Types.ObjectId(adminId);
  const uniqueMembers = new Set(input.memberIds);
  uniqueMembers.add(adminId);

  const members = Array.from(uniqueMembers).map(id => new Types.ObjectId(id));
  const validUsers = await User.countDocuments({
    _id: { $in: members },
    role: { $in: ['admin', 'employee', 'hr'] },
  });

  if (validUsers !== members.length) {
    throw ApiError.badRequest('One or more selected members are invalid');
  }

  const group = await ChatGroup.create({
    name: input.name.trim(),
    type: 'group',
    members,
    createdBy: adminObjectId,
    photo: input.photo || '',
  });

  return group;
};

export const updateGroup = async (
  adminId: string,
  groupId: string,
  input: Partial<CreateGroupInput>,
) => {
  const group = await ChatGroup.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Chat group not found');
  }
  if (group.type === 'team') {
    throw ApiError.badRequest('Team chat cannot be edited');
  }
  if (!group.createdBy.equals(new Types.ObjectId(adminId))) {
    throw ApiError.forbidden('Only the admin who manages groups can update this chat');
  }

  if (input.name?.trim()) {
    group.name = input.name.trim();
  }
  if (input.photo !== undefined) {
    group.photo = input.photo;
  }
  if (input.memberIds) {
    const uniqueMembers = new Set(input.memberIds);
    uniqueMembers.add(adminId);
    group.members = Array.from(uniqueMembers).map(id => new Types.ObjectId(id));
  }

  await group.save();
  return group;
};

export const deleteGroup = async (adminId: string, groupId: string) => {
  const group = await ChatGroup.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Chat group not found');
  }
  if (group.type === 'team') {
    throw ApiError.badRequest('Team chat cannot be deleted');
  }
  if (!group.createdBy.equals(new Types.ObjectId(adminId))) {
    throw ApiError.forbidden('Only the admin who manages groups can delete this chat');
  }

  await ChatMessage.deleteMany({ groupId: group._id });
  await group.deleteOne();
};

export const getGroupById = async (groupId: string, userId: string) => {
  const group = await ChatGroup.findById(groupId)
    .populate('members', 'fullName employeeId role department designation profilePhoto')
    .populate('createdBy', 'fullName role');
  if (!group) {
    throw ApiError.notFound('Chat group not found');
  }
  await assertGroupAccess(group, new Types.ObjectId(userId));
  return group;
};

export const listMessages = async (
  groupId: string,
  userId: string,
  page: number,
  limit: number,
) => {
  const group = await ChatGroup.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Chat group not found');
  }
  await assertGroupAccess(group, new Types.ObjectId(userId));

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    ChatMessage.find({ groupId: group._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'fullName employeeId role profilePhoto'),
    ChatMessage.countDocuments({ groupId: group._id }),
  ]);

  return {
    items: items.reverse(),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

interface SendMessageInput {
  content?: string;
  messageType: ChatMessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  voiceDuration?: number;
}

export const sendMessage = async (
  groupId: string,
  userId: string,
  input: SendMessageInput,
) => {
  const group = await ChatGroup.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Chat group not found');
  }
  const senderObjectId = new Types.ObjectId(userId);
  await assertGroupAccess(group, senderObjectId);

  if (input.messageType === 'text' && !input.content?.trim()) {
    throw ApiError.badRequest('Message content is required');
  }

  if (input.messageType !== 'text' && !input.attachmentUrl) {
    throw ApiError.badRequest('Attachment is required for this message type');
  }

  const message = await ChatMessage.create({
    groupId: group._id,
    sender: senderObjectId,
    messageType: input.messageType,
    content: input.content?.trim() || '',
    attachmentUrl: input.attachmentUrl || '',
    attachmentName: input.attachmentName || '',
    attachmentMimeType: input.attachmentMimeType || '',
    voiceDuration: input.voiceDuration,
  });

  const preview = buildMessagePreview(input.messageType, input.content);
  group.lastMessageAt = new Date();
  group.lastMessagePreview = preview;
  group.lastMessageSender = senderObjectId;
  await group.save();

  await notifyChatMembers(group, senderObjectId, preview);

  const populated = await ChatMessage.findById(message._id).populate(
    'sender',
    'fullName employeeId role profilePhoto',
  );

  return populated;
};

export const resolveAttachmentMessageType = (
  mimeType: string,
): ChatMessageType => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('audio/')) {
    return 'voice';
  }
  return 'file';
};
