import { FilterQuery } from 'mongoose';
import { User, IUser } from '../models/User';
import { AnnouncementAudience } from '../types';
import { createNotificationsForUsers } from './notificationService';

interface SendAnnouncementInput {
  title: string;
  message: string;
  audience: AnnouncementAudience;
}

/** Active staff plus accounts pending first-login verification. */
function reachableStaffFilter(): FilterQuery<IUser> {
  return {
    $or: [
      { status: 'active' },
      { status: 'inactive', isVerified: false },
    ],
  };
}

function buildAudienceFilter(audience: AnnouncementAudience): FilterQuery<IUser> {
  const filter: FilterQuery<IUser> = {
    ...reachableStaffFilter(),
  };

  switch (audience) {
    case 'employees':
      filter.role = 'employee';
      break;
    case 'hr':
      filter.role = 'hr';
      break;
    case 'all':
      filter.role = { $in: ['employee', 'hr'] };
      break;
  }

  return filter;
}

export const sendAnnouncement = async (
  input: SendAnnouncementInput,
): Promise<{ recipientCount: number }> => {
  const users = await User.find(buildAudienceFilter(input.audience)).select('_id');
  const recipientIds = users.map(user => user._id);

  await createNotificationsForUsers(recipientIds, {
    title: input.title,
    message: input.message,
    type: 'announcement',
  });

  return { recipientCount: recipientIds.length };
};
