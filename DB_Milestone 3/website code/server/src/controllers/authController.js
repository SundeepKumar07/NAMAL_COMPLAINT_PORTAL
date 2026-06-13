const { body } = require('express-validator');
const { User, EndUser, Admin, MaintenanceStaff } = require('../models');
const { comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { writeAudit } = require('../utils/audit');

function formatUserResponse(user) {
  const base = {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    phone_no: user.phone_no,
    role_type: user.role_type,
    account_status: user.account_status,
    profile_picture: user.profile_picture,
  };

  if (user.EndUser) {
    base.profile = {
      user_type: user.EndUser.user_type,
      university_id: user.EndUser.university_id,
      department_id: user.EndUser.department_id,
    };
  }
  if (user.Admin) {
    base.profile = {
      access_level: user.Admin.access_level,
      designation: user.Admin.designation,
    };
  }
  if (user.MaintenanceStaff) {
    base.profile = {
      staff_code: user.MaintenanceStaff.staff_code,
      availability_status: user.MaintenanceStaff.availability_status,
      workload_count: user.MaintenanceStaff.workload_count,
    };
  }

  return base;
}

async function login(req, res) {
  const { email, password, role_type, identifier } = req.body;

  try {
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
      include: [
        { model: EndUser, required: false },
        { model: Admin, required: false },
        { model: MaintenanceStaff, required: false },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role_type !== role_type) {
      return res.status(401).json({ message: 'Invalid credentials for this login portal' });
    }

    if (user.account_status !== 'active') {
      return res.status(403).json({ message: 'Account is inactive or suspended' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (role_type === 'end_user') {
      if (!identifier || user.EndUser?.university_id !== identifier.trim()) {
        return res.status(401).json({ message: 'Invalid university ID' });
      }
    }

    if (role_type === 'maintenance_staff') {
      if (!identifier || user.MaintenanceStaff?.staff_code !== identifier.trim()) {
        return res.status(401).json({ message: 'Invalid staff ID' });
      }
    }

    const token = signToken({ user_id: user.user_id, role_type: user.role_type });
    await writeAudit(user.user_id, 'login', 'users', { role_type });

    return res.json({
      message: 'Login successful',
      token,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
}

async function me(req, res) {
  return res.json({ user: formatUserResponse(req.user) });
}

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role_type')
    .isIn(['admin', 'end_user', 'maintenance_staff'])
    .withMessage('Invalid role type'),
];

module.exports = { login, me, loginValidation, formatUserResponse };
