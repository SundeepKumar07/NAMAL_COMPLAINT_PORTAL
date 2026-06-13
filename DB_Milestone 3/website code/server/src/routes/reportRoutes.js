const express = require('express');
const { body } = require('express-validator');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  getAnalytics,
  createResolution,
  getResolutionReport,
  listResolved,
} = require('../controllers/reportController');

const router = express.Router();
router.use(authMiddleware, requireRole('admin'));

router.get('/analytics', getAnalytics);
router.get('/resolved', listResolved);
router.get('/complaint/:id', getResolutionReport);
router.post(
  '/complaint/:id/resolution',
  [body('resolution_summary').trim().notEmpty().isLength({ max: 2000 })],
  validate,
  createResolution
);

module.exports = router;
