const { Notification } = require('../models');

/**
 * Create an in-app notification for a user.
 * Silent fail — never throw.
 */
async function notify(userId, message, complaintId = null) {
  try {
    await Notification.create({
      user_id: userId,
      complaint_id: complaintId || null,
      message,
    });
  } catch (err) {
    console.error('Notify write failed:', err.message);
  }
}

module.exports = { notify };
