import Notification from '../models/Notification.js';
import { getIO } from '../socket.js';

export async function createNotification({ recipient, sender, type, post = null }) {
  if (!recipient || !sender) return;
  if (recipient.toString() === sender.toString()) return;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await Notification.findOne({
    recipient, sender, type,
    post: post ?? null,
    createdAt: { $gte: since },
  });
  if (existing) return;

  const notification = await Notification.create({ recipient, sender, type, post });
  await notification.populate([
    { path: 'sender', select: 'name avatar' },
    { path: 'post',   select: 'title slug' },
  ]);

  getIO()?.to(recipient.toString()).emit('notification', notification);
}
