const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getNotifications, markRead, markOneRead } = require('../controllers/notificationController');

const router = express.Router();
router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/read-all', markRead);
router.patch('/:id/read', markOneRead);

module.exports = router;
