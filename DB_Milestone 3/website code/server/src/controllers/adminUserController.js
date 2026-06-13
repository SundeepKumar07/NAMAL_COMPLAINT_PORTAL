const { Op } = require('sequelize');
const {
  sequelize,
  User,
  EndUser,
  Admin,
  MaintenanceStaff,
  Department,
  Category,
  StaffSpecialization,
} = require('../models');
const { hashPassword } = require('../utils/password');
const { writeAudit } = require('../utils/audit');

async function listUsers(req, res) {
  const { role_type, search, status } = req.query;
  const where = {};

  if (role_type && role_type !== 'all') {
    where.role_type = role_type;
  }
  if (status) {
    where.account_status = status;
  }
  if (search) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  try {
    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        { model: EndUser, required: false, include: [{ model: Department, required: false }] },
        { model: Admin, required: false },
        {
          model: MaintenanceStaff,
          required: false,
          include: [{ model: StaffSpecialization, include: [Category] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json({ users });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
}

async function createEndUser(req, res) {
  const {
    full_name,
    email,
    password,
    phone_no,
    user_type,
    university_id,
    department_id,
  } = req.body;

  const t = await sequelize.transaction();
  try {
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      await t.rollback();
      return res.status(409).json({ message: 'Email already registered' });
    }

    const existingId = await EndUser.findOne({ where: { university_id: university_id.trim() } });
    if (existingId) {
      await t.rollback();
      return res.status(409).json({ message: 'University ID already exists' });
    }

    const hashed = await hashPassword(password);
    const user = await User.create(
      {
        full_name,
        email: email.toLowerCase().trim(),
        password: hashed,
        phone_no: phone_no || null,
        role_type: 'end_user',
        account_status: 'active',
      },
      { transaction: t }
    );

    await EndUser.create(
      {
        user_id: user.user_id,
        user_type,
        university_id: university_id.trim(),
        department_id: department_id || null,
      },
      { transaction: t }
    );

    await t.commit();
    await writeAudit(req.user.user_id, 'create_user', 'end_users', {
      created_user_id: user.user_id,
      user_type,
    });

    const created = await User.findByPk(user.user_id, {
      attributes: { exclude: ['password'] },
      include: [{ model: EndUser, include: [Department] }],
    });

    return res.status(201).json({ message: 'Complaint filer account created', user: created });
  } catch (err) {
    await t.rollback();
    console.error('Create end user error:', err);
    return res.status(500).json({ message: 'Failed to create user' });
  }
}

async function createStaff(req, res) {
  const {
    full_name,
    email,
    password,
    phone_no,
    staff_code,
    availability_status,
    category_ids,
  } = req.body;

  const t = await sequelize.transaction();
  try {
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      await t.rollback();
      return res.status(409).json({ message: 'Email already registered' });
    }

    const existingCode = await MaintenanceStaff.findOne({
      where: { staff_code: staff_code.trim() },
    });
    if (existingCode) {
      await t.rollback();
      return res.status(409).json({ message: 'Staff ID already exists' });
    }

    const hashed = await hashPassword(password);
    const user = await User.create(
      {
        full_name,
        email: email.toLowerCase().trim(),
        password: hashed,
        phone_no: phone_no || null,
        role_type: 'maintenance_staff',
        account_status: 'active',
      },
      { transaction: t }
    );

    await MaintenanceStaff.create(
      {
        user_id: user.user_id,
        staff_code: staff_code.trim(),
        availability_status: availability_status || 'available',
        workload_count: 0,
      },
      { transaction: t }
    );

    if (Array.isArray(category_ids) && category_ids.length > 0) {
      await StaffSpecialization.bulkCreate(
        category_ids.map((category_id) => ({
          staff_id: user.user_id,
          category_id,
          proficiency_level: 'intermediate',
        })),
        { transaction: t }
      );
    }

    await t.commit();
    await writeAudit(req.user.user_id, 'create_user', 'maintenance_staff', {
      created_user_id: user.user_id,
      staff_code,
    });

    const created = await User.findByPk(user.user_id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: MaintenanceStaff,
          include: [{ model: StaffSpecialization, include: [Category] }],
        },
      ],
    });

    return res.status(201).json({ message: 'Maintenance staff account created', user: created });
  } catch (err) {
    await t.rollback();
    console.error('Create staff error:', err);
    return res.status(500).json({ message: 'Failed to create staff' });
  }
}

async function updateUserStatus(req, res) {
  const { user_id } = req.params;
  const { account_status } = req.body;

  if (user_id === req.user.user_id) {
    return res.status(400).json({ message: 'You cannot change your own account status' });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role_type === 'admin') {
      return res.status(403).json({ message: 'Cannot modify admin accounts through this endpoint' });
    }

    user.account_status = account_status;
    await user.save();

    await writeAudit(req.user.user_id, 'update_user_status', 'users', {
      target_user_id: user_id,
      account_status,
    });

    return res.json({ message: 'User status updated', user_id, account_status });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ message: 'Failed to update user status' });
  }
}

async function getLookupData(req, res) {
  try {
    const [departments, categories] = await Promise.all([
      Department.findAll({ order: [['department_name', 'ASC']] }),
      Category.findAll({ order: [['category_name', 'ASC']] }),
    ]);
    return res.json({ departments, categories });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch lookup data' });
  }
}

module.exports = {
  listUsers,
  createEndUser,
  createStaff,
  updateUserStatus,
  getLookupData,
};
