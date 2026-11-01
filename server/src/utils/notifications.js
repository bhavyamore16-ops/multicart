import { getNotificationModel } from '../models/dataAccess.js';

export const createUserNotification = async (userId, { type, title, message, href = '' }) => {
  if (!userId) return null;
  try {
    return await getNotificationModel().create({ user: userId, type, title, message, href });
  } catch (error) {
    // Notification delivery must not roll back an already committed order or vendor decision.
    console.error('[Notification] Could not persist notification:', error.message);
    return null;
  }
};
