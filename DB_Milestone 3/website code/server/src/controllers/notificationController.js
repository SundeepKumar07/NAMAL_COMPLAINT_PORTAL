/**
 * Phase 4 — Notifications
 */
const { Notification, Complaint } = require('../models');

async function getNotifications(req, res) {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.user_id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    return res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
}

async function markRead(req, res) {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.user_id, is_read: false } }
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update notifications' });
  }
}

async function markOneRead(req, res) {
  const { id } = req.params;
  try {
    await Notification.update(
      { is_read: true },
      { where: { notification_id: id, user_id: req.user.user_id } }
    );
    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update notification' });
  }
}

module.exports = { getNotifications, markRead, markOneRead };
