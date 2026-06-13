const express = require('express');
const { body } = require('express-validator');
const {
  listUsers,
  createEndUser,
  createStaff,
  updateUserStatus,
  getLookupData,
} = require('../controllers/adminUserController');
const {
  assignComplaint,
  updateComplaintStatus,
  getAdminStats,
  getAvailableStaff,
} = require('../controllers/adminComplaintController');
const { listComplaints, getComplaint, addComment } = require('../controllers/complaintController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware, requireRole('admin'));

// ─── User management ─────────────────────────────────────────────────────────
router.get('/lookup', getLookupData);
router.get('/users', listUsers);

router.post(
  '/users/filers',
  [
    body('full_name').trim().notEmpty().isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('user_type').isIn(['student', 'faculty', 'staff']),
    body('university_id').trim().notEmpty(),
    body('phone_no').optional().isLength({ max: 20 }),
    body('department_id').optional().isInt(),
  ],
  validate,
  createEndUser
);

router.post(
  '/users/staff',
  [
    body('full_name').trim().notEmpty().isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('staff_code').trim().notEmpty(),
    body('phone_no').optional().isLength({ max: 20 }),
    body('availability_status').optional().isIn(['available', 'busy', 'off_duty']),
    body('category_ids').optional().isArray(),
  ],
  validate,
  createStaff
);

router.patch(
  '/users/:user_id/status',
  [body('account_status').isIn(['active', 'inactive', 'suspended'])],
  validate,
  updateUserStatus
);

// ─── Complaint management ─────────────────────────────────────────────────────
router.get('/stats', getAdminStats);
router.get('/staff/available', getAvailableStaff);

// Admin views all complaints (reuse complaint controller - role check inside)
router.get('/complaints', listComplaints);
router.get('/complaints/:id', getComplaint);

router.post(
  '/complaints/:id/assign',
  [body('staff_id').notEmpty().withMessage('staff_id required')],
  validate,
  assignComplaint
);

router.patch(
  '/complaints/:id/status',
  [
    body('status_name').isIn(['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed']).withMessage('Invalid status'),
    body('remarks').optional().isLength({ max: 500 }),
  ],
  validate,
  updateComplaintStatus
);

router.post(
  '/complaints/:id/comments',
  [body('content').trim().notEmpty().isLength({ max: 1000 })],
  validate,
  addComment
);

module.exports = router;
