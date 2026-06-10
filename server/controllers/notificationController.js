import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';

// @desc  Get latest 20 notifications + unread count for current user
// @route GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('sender', 'name avatar')
      .populate('post', 'title slug'),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
  ]);
  res.json({ notifications, unreadCount });
});

// @desc  Mark all notifications as read
// @route PUT /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true }
  );
  res.json({ success: true });
});

// @desc  Delete a single notification
// @route DELETE /api/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id });
  res.json({ success: true });
});
