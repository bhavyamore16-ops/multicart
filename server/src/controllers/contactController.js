import { getContactMessageModel } from '../models/dataAccess.js';
import { createUserNotification } from '../utils/notifications.js';

const plain = item => item?.toJSON ? item.toJSON() : item;

export const createContactMessage = async (req, res, next) => {
  try {
    const name = String(req.body?.name || req.user?.name || '').trim();
    const email = String(req.body?.email || req.user?.email || '').trim().toLowerCase();
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    if (name.length < 2 || name.length > 100) return res.status(400).json({ success: false, message: 'Name must be between 2 and 100 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    if (subject.length < 3 || subject.length > 160) return res.status(400).json({ success: false, message: 'Subject must be between 3 and 160 characters.' });
    if (message.length < 10 || message.length > 5000) return res.status(400).json({ success: false, message: 'Message must be between 10 and 5000 characters.' });

    const saved = await getContactMessageModel().create({ customer: req.user?._id || null, name, email, subject, message });
    res.status(201).json({ success: true, message: 'Your message has been sent to MultiCart support.', contactMessage: plain(saved) });
  } catch (error) { next(error); }
};

export const getMyContactMessages = async (req, res, next) => {
  try {
    const messages = await getContactMessageModel().find({ customer: req.user._id });
    res.json({ success: true, count: messages.length, messages: messages.map(plain) });
  } catch (error) { next(error); }
};

export const getAdminContactMessages = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && ['new', 'in_progress', 'resolved'].includes(status)) query.status = status;
    const messages = await getContactMessageModel().find(query);
    res.json({ success: true, count: messages.length, messages: messages.map(plain) });
  } catch (error) { next(error); }
};

export const updateAdminContactMessage = async (req, res, next) => {
  try {
    const { status, adminReply } = req.body || {};
    const updates = {};
    if (status !== undefined) {
      if (!['new', 'in_progress', 'resolved'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid support message status.' });
      updates.status = status;
    }
    if (adminReply !== undefined) {
      if (typeof adminReply !== 'string' || adminReply.length > 5000) return res.status(400).json({ success: false, message: 'Reply must be text up to 5000 characters.' });
      updates.adminReply = adminReply.trim();
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'Provide a status or reply to update.' });
    const MessageModel = getContactMessageModel();
    const saved = await MessageModel.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!saved) return res.status(404).json({ success: false, message: 'Support message not found.' });
    if (updates.adminReply && saved.customer) await createUserNotification(saved.customer, {
      type: 'support_reply', title: 'Support replied to your message', message: saved.subject, href: '/contact'
    });
    res.json({ success: true, message: plain(saved) });
  } catch (error) { next(error); }
};

export const deleteAdminContactMessage = async (req, res, next) => {
  try {
    const deleted = await getContactMessageModel().findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Support message not found.' });
    res.json({ success: true, message: 'Support message deleted.' });
  } catch (error) { next(error); }
};
