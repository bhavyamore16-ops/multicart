import { getNotificationModel } from '../models/dataAccess.js';
import { idOf } from '../utils/productPresentation.js';

const plain = item => item?.toJSON ? item.toJSON() : item;

export const getMyNotifications = async (req, res, next) => {
  try {
    const NotificationModel = getNotificationModel();
    const notifications = await NotificationModel.find({ user: req.user._id });
    const sorted = (notifications || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({
      success: true,
      unreadCount: sorted.filter(item => !item.readAt).length,
      notifications: sorted.slice(0, 50).map(plain)
    });
  } catch (error) { next(error); }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const NotificationModel = getNotificationModel();
    const notification = await NotificationModel.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    if (idOf(notification.user) !== idOf(req.user._id)) return res.status(403).json({ success: false, message: 'You cannot update another user’s notification.' });
    const updated = await NotificationModel.findByIdAndUpdate(notification._id, { readAt: notification.readAt || new Date() }, { new: true });
    res.json({ success: true, notification: plain(updated) });
  } catch (error) { next(error); }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const NotificationModel = getNotificationModel();
    const unread = await NotificationModel.find({ user: req.user._id, readAt: null });
    await Promise.all((unread || []).map(item => NotificationModel.findByIdAndUpdate(item._id, { readAt: new Date() }, { new: true })));
    res.json({ success: true, updatedCount: unread?.length || 0 });
  } catch (error) { next(error); }
};
