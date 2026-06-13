const { Op } = require('sequelize');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  sequelize,
  Complaint,
  ComplaintImage,
  ComplaintStatus,
  PriorityLevel,
  Category,
  Location,
  Building,
  User,
  EndUser,
  StatusHistory,
  Comment,
  ComplaintAssignment,
  MaintenanceStaff,
  AttachmentType,
} = require('../models');
const { generateTicketId } = require('../utils/ticketId');
const { writeAudit } = require('../utils/audit');
const { uploadBuffer } = require('../utils/cloudinary');

// ─── Image upload helper (shared by submit + staff) ─────────────────────────

const hasCloudinary = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key';

async function saveImage(file, subfolder = 'complaints') {
  if (hasCloudinary()) {
    return uploadBuffer(file.buffer, subfolder);
  }
  // Local fallback — short hash path so it fits VARCHAR(500)
  const hash = crypto.createHash('sha1').update(file.buffer).digest('hex').slice(0, 16);
  const ext = file.mimetype.split('/')[1] || 'jpg';
  const uploadDir = path.join(__dirname, '../../../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, `${hash}.${ext}`), file.buffer);
  return `/uploads/${hash}.${ext}`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const COMPLAINT_INCLUDE = [
  { model: ComplaintStatus, as: 'status', attributes: ['status_id', 'status_name'] },
  { model: PriorityLevel, as: 'priority', attributes: ['priority_id', 'priority_name', 'response_time_hours'] },
  { model: Category, attributes: ['category_id', 'category_name'] },
  {
    model: Location,
    attributes: ['location_id', 'room_no', 'floor_no'],
    include: [{ model: Building, attributes: ['building_id', 'building_name', 'campus_area'] }],
  },
  {
    model: User,
    as: 'submitter',
    attributes: ['user_id', 'full_name', 'email'],
    include: [{ model: EndUser, attributes: ['university_id', 'user_type'], required: false }],
  },
  {
    model: ComplaintImage,
    attributes: ['image_id', 'image_url', 'uploaded_at'],
    include: [{ model: AttachmentType, attributes: ['type_name'] }],
  },
  {
    model: ComplaintAssignment,
    required: false,
    include: [
      {
        model: MaintenanceStaff,
        as: 'assignee',
        attributes: ['user_id', 'staff_code'],
        include: [{ model: User, attributes: ['full_name'], foreignKey: 'user_id' }],
      },
    ],
  },
  {
    model: StatusHistory,
    include: [
      { model: ComplaintStatus, as: 'oldStatus', attributes: ['status_name'] },
      { model: ComplaintStatus, as: 'newStatus', attributes: ['status_name'] },
      { model: User, as: 'changer', attributes: ['full_name', 'role_type'] },
    ],
    order: [['changed_at', 'ASC']],
  },
  {
    model: Comment,
    include: [{ model: User, as: 'author', attributes: ['full_name', 'role_type'] }],
    order: [['comment_at', 'ASC']],
  },
];

// ─── List own complaints (end_user) or all (admin) ──────────────────────────

async function listComplaints(req, res) {
  const { status, priority, category, search, page = 1 } = req.query;
  const limit = 20;
  const offset = (Number(page) - 1) * limit;

  const where = {};

  // End users see only their own complaints
  if (req.user.role_type === 'end_user') {
    where.submitted_by = req.user.user_id;
  }

  // Maintenance staff see only complaints assigned to them
  if (req.user.role_type === 'maintenance_staff') {
    // We'll filter via a required include on ComplaintAssignment
  }

  // Filters via sub-query include conditions
  const statusWhere = status ? { status_name: status } : undefined;
  const priorityWhere = priority ? { priority_name: priority } : undefined;
  const categoryWhere = category ? { category_name: category } : undefined;

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { ticket_id: { [Op.like]: `%${search}%` } },
    ];
  }

  try {
    // Build assignment include — required for staff to scope to their tasks
    const assignmentInclude = req.user.role_type === 'maintenance_staff'
      ? {
          model: ComplaintAssignment,
          required: true,
          where: { assigned_to: req.user.user_id },
        }
      : { model: ComplaintAssignment, required: false };

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        { model: ComplaintStatus, as: 'status', attributes: ['status_id', 'status_name'], where: statusWhere, required: !!statusWhere },
        { model: PriorityLevel, as: 'priority', attributes: ['priority_id', 'priority_name'], where: priorityWhere, required: !!priorityWhere },
        { model: Category, attributes: ['category_id', 'category_name'], where: categoryWhere, required: !!categoryWhere },
        {
          model: Location,
          attributes: ['room_no', 'floor_no'],
          include: [{ model: Building, attributes: ['building_name'] }],
        },
        { model: User, as: 'submitter', attributes: ['full_name', 'email'] },
        { model: ComplaintImage, attributes: ['image_id', 'image_url'], limit: 1 },
        assignmentInclude,
      ],
      order: [['submitted_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      complaints: rows,
      pagination: { total: count, page: Number(page), pages: Math.ceil(count / limit), limit },
    });
  } catch (err) {
    console.error('List complaints error:', err);
    return res.status(500).json({ message: 'Failed to fetch complaints' });
  }
}

// ─── Get single complaint with full detail ──────────────────────────────────

async function getComplaint(req, res) {
  const { id } = req.params;

  try {
    const complaint = await Complaint.findByPk(id, { include: COMPLAINT_INCLUDE });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // End users can only see their own
    if (req.user.role_type === 'end_user' && complaint.submitted_by !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Staff can only see complaints assigned to them
    if (req.user.role_type === 'maintenance_staff') {
      const assignedToMe = complaint.ComplaintAssignment?.assigned_to === req.user.user_id;
      if (!assignedToMe) return res.status(403).json({ message: 'Access denied' });
    }

    return res.json({ complaint });
  } catch (err) {
    console.error('Get complaint error:', err);
    return res.status(500).json({ message: 'Failed to fetch complaint' });
  }
}

// ─── Submit new complaint ────────────────────────────────────────────────────

async function createComplaint(req, res) {
  const { title, description, category_id, priority_id, location_id, expected_resolution_date } = req.body;
  const files = req.files || [];

  const t = await sequelize.transaction();
  try {
    const openStatus = await ComplaintStatus.findOne({ where: { status_name: 'Open' } });
    if (!openStatus) throw new Error('Open status not found in database');

    const ticket_id = await generateTicketId();

    const complaint = await Complaint.create(
      {
        ticket_id,
        title: title.trim(),
        description: description.trim(),
        category_id: Number(category_id),
        priority_id: Number(priority_id),
        location_id: Number(location_id),
        status_id: openStatus.status_id,
        submitted_by: req.user.user_id,
        expected_resolution_date: expected_resolution_date || null,
      },
      { transaction: t }
    );

    await StatusHistory.create(
      {
        complaint_id: complaint.complaint_id,
        old_status_id: null,
        new_status_id: openStatus.status_id,
        changed_by: req.user.user_id,
        remarks: 'Complaint submitted',
      },
      { transaction: t }
    );

    await t.commit();

    // Save images after commit (non-critical — don't roll back complaint if image fails)
    if (files.length > 0) {
      const attachType = await AttachmentType.findOne({ where: { type_name: 'complaint_photo' } });
      await Promise.allSettled(
        files.map(async (file) => {
          const url = await saveImage(file, 'complaints');
          return ComplaintImage.create({
            complaint_id: complaint.complaint_id,
            attachment_type_id: attachType?.attachment_type_id || 1,
            uploaded_by: req.user.user_id,
            image_url: url,
          });
        })
      );
    }

    await writeAudit(req.user.user_id, 'create_complaint', 'complaints', { ticket_id });

    const created = await Complaint.findByPk(complaint.complaint_id, { include: COMPLAINT_INCLUDE });
    return res.status(201).json({ message: 'Complaint submitted', complaint: created });
  } catch (err) {
    await t.rollback();
    console.error('Create complaint error:', err);
    return res.status(500).json({ message: 'Failed to submit complaint' });
  }
}

// ─── Edit complaint (Open status only) ──────────────────────────────────────

async function updateComplaint(req, res) {
  const { id } = req.params;
  const { title, description, category_id, priority_id } = req.body;

  try {
    const complaint = await Complaint.findByPk(id, {
      include: [{ model: ComplaintStatus, as: 'status' }],
    });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Only submitter can edit
    if (complaint.submitted_by !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (complaint.status.status_name !== 'Open') {
      return res.status(400).json({ message: 'Only open complaints can be edited' });
    }

    if (title) complaint.title = title.trim();
    if (description) complaint.description = description.trim();
    if (category_id) complaint.category_id = Number(category_id);
    if (priority_id) complaint.priority_id = Number(priority_id);

    await complaint.save();
    await writeAudit(req.user.user_id, 'edit_complaint', 'complaints', { complaint_id: id });

    const updated = await Complaint.findByPk(id, { include: COMPLAINT_INCLUDE });
    return res.json({ message: 'Complaint updated', complaint: updated });
  } catch (err) {
    console.error('Update complaint error:', err);
    return res.status(500).json({ message: 'Failed to update complaint' });
  }
}

// ─── Cancel complaint (Open status only) ────────────────────────────────────

async function cancelComplaint(req, res) {
  const { id } = req.params;

  const t = await sequelize.transaction();
  try {
    const complaint = await Complaint.findByPk(id, {
      include: [{ model: ComplaintStatus, as: 'status' }],
    });
    if (!complaint) { await t.rollback(); return res.status(404).json({ message: 'Complaint not found' }); }

    if (complaint.submitted_by !== req.user.user_id) {
      await t.rollback();
      return res.status(403).json({ message: 'Access denied' });
    }

    if (complaint.status.status_name !== 'Open') {
      await t.rollback();
      return res.status(400).json({ message: 'Only open complaints can be cancelled' });
    }

    const closedStatus = await ComplaintStatus.findOne({ where: { status_name: 'Closed' } });
    const oldStatusId = complaint.status_id;

    complaint.status_id = closedStatus.status_id;
    await complaint.save({ transaction: t });

    await StatusHistory.create(
      {
        complaint_id: complaint.complaint_id,
        old_status_id: oldStatusId,
        new_status_id: closedStatus.status_id,
        changed_by: req.user.user_id,
        remarks: 'Cancelled by submitter',
      },
      { transaction: t }
    );

    await t.commit();
    await writeAudit(req.user.user_id, 'cancel_complaint', 'complaints', { complaint_id: id });
    return res.json({ message: 'Complaint cancelled' });
  } catch (err) {
    await t.rollback();
    console.error('Cancel complaint error:', err);
    return res.status(500).json({ message: 'Failed to cancel complaint' });
  }
}

// ─── Add comment ─────────────────────────────────────────────────────────────

async function addComment(req, res) {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const complaint = await Complaint.findByPk(id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // End users can only comment on their own complaints
    if (req.user.role_type === 'end_user' && complaint.submitted_by !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const commentTypeMap = { end_user: 'user', maintenance_staff: 'staff', admin: 'admin' };
    const comment = await Comment.create({
      complaint_id: id,
      user_id: req.user.user_id,
      content: content.trim(),
      comment_type: commentTypeMap[req.user.role_type] || 'user',
    });

    const withAuthor = await Comment.findByPk(comment.comment_id, {
      include: [{ model: User, as: 'author', attributes: ['full_name', 'role_type'] }],
    });

    return res.status(201).json({ message: 'Comment added', comment: withAuthor });
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ message: 'Failed to add comment' });
  }
}

// ─── Lookup data for complaint form ─────────────────────────────────────────

async function getComplaintLookups(req, res) {
  try {
    const [categories, priorities, buildings] = await Promise.all([
      Category.findAll({ order: [['category_name', 'ASC']] }),
      PriorityLevel.findAll({ order: [['priority_id', 'ASC']] }),
      Building.findAll({
        order: [['building_name', 'ASC']],
        include: [{ model: Location, attributes: ['location_id', 'room_no', 'floor_no'] }],
      }),
    ]);
    return res.json({ categories, priorities, buildings });
  } catch (err) {
    console.error('Complaint lookups error:', err);
    return res.status(500).json({ message: 'Failed to fetch lookup data' });
  }
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

async function getStats(req, res) {
  try {
    let baseWhere = {};
    let assignmentFilter = null;

    if (req.user.role_type === 'end_user') {
      baseWhere.submitted_by = req.user.user_id;
    } else if (req.user.role_type === 'maintenance_staff') {
      assignmentFilter = { assigned_to: req.user.user_id };
    }

    // Get all statuses
    const allStatuses = await ComplaintStatus.findAll({ attributes: ['status_id', 'status_name'] });

    // Count per status using direct Complaint queries
    const counts = await Promise.all(
      allStatuses.map(async (s) => {
        const where = { ...baseWhere, status_id: s.status_id };
        let count;
        if (assignmentFilter) {
          count = await Complaint.count({
            where,
            include: [{ model: ComplaintAssignment, required: true, where: assignmentFilter }],
            distinct: true,
            col: 'complaint_id',
          });
        } else {
          count = await Complaint.count({ where });
        }
        return { status_name: s.status_name, count };
      })
    );

    // Total
    let total;
    if (assignmentFilter) {
      total = await Complaint.count({
        where: baseWhere,
        include: [{ model: ComplaintAssignment, required: true, where: assignmentFilter }],
        distinct: true,
        col: 'complaint_id',
      });
    } else {
      total = await Complaint.count({ where: baseWhere });
    }

    const statusMap = {};
    counts.forEach(({ status_name, count }) => {
      statusMap[status_name.toLowerCase().replace(' ', '_')] = count;
    });

    return res.json({
      stats: {
        total,
        open: statusMap.open || 0,
        assigned: statusMap.assigned || 0,
        in_progress: statusMap.in_progress || 0,
        resolved: statusMap.resolved || 0,
        closed: statusMap.closed || 0,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ message: 'Failed to fetch stats' });
  }
}

module.exports = {
  listComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  cancelComplaint,
  addComment,
  getComplaintLookups,
  getStats,
};
