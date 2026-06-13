const express = require('express');
const { body } = require('express-validator');
const {
  listComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  cancelComplaint,
  addComment,
  getComplaintLookups,
  getStats,
} = require('../controllers/complaintController');
const { submitFeedback, getFeedback } = require('../controllers/feedbackController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');

const router = express.Router();
router.use(authMiddleware);

router.get('/lookups', getComplaintLookups);
router.get('/stats', getStats);
router.get('/', listComplaints);

// POST with optional images (multipart)
router.post(
  '/',
  upload.array('images', 3),
  [
    body('title').trim().notEmpty().isLength({ max: 100 }),
    body('description').trim().notEmpty().isLength({ max: 1000 }),
    body('category_id').isInt({ min: 1 }),
    body('priority_id').isInt({ min: 1 }),
    body('location_id').isInt({ min: 1 }),
    body('expected_resolution_date').optional().isISO8601(),
  ],
  validate,
  createComplaint
);

router.get('/:id', getComplaint);

router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().trim().notEmpty().isLength({ max: 1000 }),
    body('category_id').optional().isInt({ min: 1 }),
    body('priority_id').optional().isInt({ min: 1 }),
  ],
  validate,
  updateComplaint
);

router.delete('/:id', cancelComplaint);

router.post(
  '/:id/comments',
  [body('content').trim().notEmpty().isLength({ max: 1000 })],
  validate,
  addComment
);

router.post(
  '/:id/feedback',
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
    body('feedback_text').optional().isLength({ max: 1000 }),
  ],
  validate,
  submitFeedback
);
router.get('/:id/feedback', getFeedback);

module.exports = router;
