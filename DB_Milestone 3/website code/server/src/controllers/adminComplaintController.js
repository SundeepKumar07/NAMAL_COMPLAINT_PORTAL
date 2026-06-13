const {
  sequelize,
  Complaint,
  ComplaintAssignment,
  ComplaintStatus,
  StatusHistory,
  MaintenanceStaff,
  User,
  Category,
  PriorityLevel,
  Location,
  Building,
  EndUser,
  ComplaintImage,
  Comment,
} = require('../models');
const { writeAudit } = require('../utils/audit');
const { notify } = require('../utils/notify');

// Full include for admin complaint detail
const ADMIN_COMPLAINT_INCLUDE = [
  { model: ComplaintStatus, as: 'status', attributes: ['status_id', 'status_name'] },
  { model: PriorityLevel, as: 'priority', attributes: ['priority_id', 'priority_name'] },
  { model: Category, attributes: ['category_id', 'category_name'] },
  {
    model: Location,
    attributes: ['location_id', 'room_no', 'floor_no'],
    include: [{ model: Building, attributes: ['building_id', 'building_name'] }],
  },
  {
    model: User,
    as: 'submitter',
    attributes: ['user_id', 'full_name', 'email'],
    include: [{ model: EndUser, attributes: ['university_id', 'user_type'], required: false }],
  },
  { model: ComplaintImage, attributes: ['image_id', 'image_url', 'uploaded_at'] },
  {
    model: ComplaintAssignment,
    required: false,
    include: [{
      model: MaintenanceStaff,
      as: 'assignee',
      attributes: ['user_id', 'staff_code'],
      include: [{ model: User, attributes: ['full_name'], foreignKey: 'user_id' }],
    }],
  },
  {
    model: StatusHistory,
    include: [
      { model: ComplaintStatus, as: 'oldStatus', attributes: ['status_name'] },
      { model: ComplaintStatus, as: 'newStatus', attributes: ['status_name'] },
      { model: User, as: 'changer', attributes: ['full_name', 'role_type'] },
    ],
    separate: true,
    order: [['changed_at', 'ASC']],
  },
  {
    model: Comment,
    include: [{ model: User, as: 'author', attributes: ['full_name', 'role_type'] }],
    separate: true,
    order: [['comment_at', 'ASC']],
  },
];

// ─── Assign complaint to staff ────────────────────────────────────────────────

async function assignComplaint(req, res) {
  const { id } = req.params;
  const { staff_id } = req.body;

  const t = await sequelize.transaction();
  try {
    const complaint = await Complaint.findByPk(id, {
      include: [{ model: ComplaintStatus, as: 'status' }, { model: ComplaintAssignment, required: false }],
    });
    if (!complaint) { await t.rollback(); return res.status(404).json({ message: 'Complaint not found' }); }

    if (!['Open', 'Assigned'].includes(complaint.status.status_name)) {
      await t.rollback();
      return res.status(400).json({ message: 'Only Open or Assigned complaints can be (re)assigned' });
    }

    const staff = await MaintenanceStaff.findByPk(staff_id);
    if (!staff) { await t.rollback(); return res.status(404).json({ message: 'Staff member not found' }); }

    const assignedStatus = await ComplaintStatus.findOne({ where: { status_name: 'Assigned' } });
    const oldStatusId = complaint.status_id;

    // Upsert assignment
    if (complaint.ComplaintAssignment) {
      // Decrement old assignee workload
      await MaintenanceStaff.decrement('workload_count', {
        where: { user_id: complaint.ComplaintAssignment.assigned_to },
        transaction: t,
      });
      complaint.ComplaintAssignment.assigned_to = staff_id;
      complaint.ComplaintAssignment.assigned_by = req.user.user_id;
      await complaint.ComplaintAssignment.save({ transaction: t });
    } else {
      await ComplaintAssignment.create(
        { complaint_id: id, assigned_to: staff_id, assigned_by: req.user.user_id },
        { transaction: t }
      );
    }

    // Update complaint status
    complaint.status_id = assignedStatus.status_id;
    await complaint.save({ transaction: t });

    // Status history
    await StatusHistory.create(
      {
        complaint_id: id,
        old_status_id: oldStatusId,
        new_status_id: assignedStatus.status_id,
        changed_by: req.user.user_id,
        remarks: `Assigned to staff ${staff_id}`,
      },
      { transaction: t }
    );

    // Increment new assignee workload
    await MaintenanceStaff.increment('workload_count', { where: { user_id: staff_id }, transaction: t });

    await t.commit();
    await writeAudit(req.user.user_id, 'assign_complaint', 'complaint_assignments', { complaint_id: id, staff_id });

    // Notify the assigned staff member
    const staffUser = await User.findByPk(staff_id);
    if (staffUser) {
      await notify(staff_id, `You have been assigned complaint: "${complaint.title}"`, id);
    }
    // Notify submitter
    await notify(complaint.submitted_by, `Your complaint "${complaint.title}" has been assigned to a staff member.`, id);

    const updated = await Complaint.findByPk(id, { include: ADMIN_COMPLAINT_INCLUDE });
    return res.json({ message: 'Complaint assigned', complaint: updated });
  } catch (err) {
    await t.rollback();
    console.error('Assign complaint error:', err);
    return res.status(500).json({ message: 'Failed to assign complaint' });
  }
}

// ─── Update complaint status (admin) ─────────────────────────────────────────

async function updateComplaintStatus(req, res) {
  const { id } = req.params;
  const { status_name, remarks } = req.body;

  const t = await sequelize.transaction();
  try {
    const complaint = await Complaint.findByPk(id);
    if (!complaint) { await t.rollback(); return res.status(404).json({ message: 'Complaint not found' }); }

    const newStatus = await ComplaintStatus.findOne({ where: { status_name } });
    if (!newStatus) { await t.rollback(); return res.status(400).json({ message: 'Invalid status' }); }

    const oldStatusId = complaint.status_id;
    complaint.status_id = newStatus.status_id;
    await complaint.save({ transaction: t });

    await StatusHistory.create(
      { complaint_id: id, old_status_id: oldStatusId, new_status_id: newStatus.status_id, changed_by: req.user.user_id, remarks: remarks || null },
      { transaction: t }
    );

    // If resolving, decrement staff workload
    if (status_name === 'Resolved' || status_name === 'Closed') {
      const assignment = await ComplaintAssignment.findOne({ where: { complaint_id: id } });
      if (assignment) {
        await MaintenanceStaff.decrement('workload_count', { where: { user_id: assignment.assigned_to }, transaction: t });
      }
    }

    await t.commit();
    await writeAudit(req.user.user_id, 'update_complaint_status', 'complaints', { complaint_id: id, status_name });

    const updated = await Complaint.findByPk(id, { include: ADMIN_COMPLAINT_INCLUDE });
    return res.json({ message: 'Status updated', complaint: updated });
  } catch (err) {
    await t.rollback();
    console.error('Update status error:', err);
    return res.status(500).json({ message: 'Failed to update status' });
  }
}

// ─── Admin stats ──────────────────────────────────────────────────────────────

async function getAdminStats(req, res) {
  try {
    const [total, allStatuses, byCategory, byPriority] = await Promise.all([
      Complaint.count(),
      ComplaintStatus.findAll({ attributes: ['status_id', 'status_name'] }),
      Complaint.findAll({
        attributes: [
          'category_id',
          [sequelize.fn('COUNT', sequelize.col('Complaint.complaint_id')), 'count'],
        ],
        group: ['category_id'],
        include: [{ model: Category, attributes: ['category_name'] }],
      }),
      Complaint.findAll({
        attributes: [
          'priority_id',
          [sequelize.fn('COUNT', sequelize.col('Complaint.complaint_id')), 'count'],
        ],
        group: ['priority_id'],
        include: [{ model: PriorityLevel, as: 'priority', attributes: ['priority_name'] }],
      }),
    ]);

    // Count per status directly
    const statusCounts = await Promise.all(
      allStatuses.map(async (s) => ({
        status_name: s.status_name,
        count: await Complaint.count({ where: { status_id: s.status_id } }),
      }))
    );

    const statusMap = {};
    statusCounts.forEach(({ status_name, count }) => {
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
      byCategory: byCategory.map((r) => ({
        label: r.Category.category_name,
        value: Number(r.dataValues.count),
      })),
      byPriority: byPriority.map((r) => ({
        label: r.priority.priority_name,
        value: Number(r.dataValues.count),
      })),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ message: 'Failed to fetch stats' });
  }
}

// ─── Available staff for assignment ──────────────────────────────────────────

async function getAvailableStaff(req, res) {
  try {
    const staff = await MaintenanceStaff.findAll({
      where: { availability_status: ['available', 'busy'] },
      include: [{ model: User, attributes: ['full_name', 'email'] }],
      order: [['workload_count', 'ASC']],
    });
    return res.json({ staff });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch staff' });
  }
}

module.exports = { assignComplaint, updateComplaintStatus, getAdminStats, getAvailableStaff };
