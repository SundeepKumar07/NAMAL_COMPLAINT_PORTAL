const express = require('express');
const { body } = require('express-validator');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const {
  staffUpdateStatus,
  addWorkLog,
  uploadProgressImages,
  getMyTask,
} = require('../controllers/staffController');

const router = express.Router();
router.use(authMiddleware, requireRole('maintenance_staff'));

// Get full task detail with work logs
router.get('/tasks/:id', getMyTask);

// Staff updates status: In Progress or Resolved
router.patch(
  '/tasks/:id/status',
  [
    body('status_name').isIn(['In Progress', 'Resolved']).withMessage('Only In Progress or Resolved allowed'),
    body('remarks').optional().isLength({ max: 500 }),
  ],
  validate,
  staffUpdateStatus
);

// Work log entry
router.post(
  '/tasks/:id/worklogs',
  [body('work_note').trim().notEmpty().isLength({ max: 2000 })],
  validate,
  addWorkLog
);

// Upload progress photos (max 3)
router.post(
  '/tasks/:id/images',
  upload.array('images', 3),
  uploadProgressImages
);

module.exports = router;
