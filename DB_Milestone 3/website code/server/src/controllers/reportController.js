/**
 * Phase 5 — Reports & Analytics (Admin only)
 */
const { Op } = require('sequelize');
const {
  sequelize,
  Complaint,
  ComplaintStatus,
  PriorityLevel,
  Category,
  Resolution,
  ComplaintAssignment,
  MaintenanceStaff,
  User,
  Feedback,
  Location,
  Building,
  WorkLog,
  ComplaintImage,
  StatusHistory,
  Comment,
  AttachmentType,
  EndUser,
} = require('../models');
const { writeAudit } = require('../utils/audit');

// ─── Full system analytics ────────────────────────────────────────────────────

async function getAnalytics(req, res) {
  const { from, to } = req.query;
  const dateWhere = {};
  if (from) dateWhere[Op.gte] = new Date(from);
  if (to)   dateWhere[Op.lte] = new Date(to);
  const submittedWhere = Object.keys(dateWhere).length ? { submitted_at: dateWhere } : {};

  try {
    // Run all independent queries in parallel
    const [total, allStatuses, byCategory, byPriority, avgRes, staffPerf] = await Promise.all([

      Complaint.count({ where: submittedWhere }),

      ComplaintStatus.findAll({ attributes: ['status_id', 'status_name'] }),

      Complaint.findAll({
        attributes: [
          'category_id',
          [sequelize.fn('COUNT', sequelize.col('Complaint.complaint_id')), 'count'],
        ],
        where: submittedWhere,
        include: [{ model: Category, attributes: ['category_name'] }],
        group: ['Complaint.category_id', 'Category.category_id'],
      }),

      Complaint.findAll({
        attributes: [
          'priority_id',
          [sequelize.fn('COUNT', sequelize.col('Complaint.complaint_id')), 'count'],
        ],
        where: submittedWhere,
        include: [{ model: PriorityLevel, as: 'priority', attributes: ['priority_name'] }],
        group: ['Complaint.priority_id', 'priority.priority_id'],
      }),

      // Raw SQL for average resolution time — avoids ORM GROUP BY issues
      sequelize.query(
        `SELECT AVG(TIMESTAMPDIFF(HOUR, c.submitted_at, r.resolved_at)) AS avg_hours
         FROM complaints c
         JOIN resolutions r ON r.complaint_id = c.complaint_id`,
        { type: sequelize.QueryTypes.SELECT }
      ),

      // Staff performance: total assignments per staff member
      // Simple raw query to avoid ONLY_FULL_GROUP_BY ORM issues
      sequelize.query(
        `SELECT
           ca.assigned_to,
           COUNT(ca.assignment_id) AS total_assigned,
           ms.staff_code,
           ms.workload_count,
           u.full_name
         FROM complaint_assignments ca
         JOIN maintenance_staff ms ON ms.user_id = ca.assigned_to
         JOIN users u ON u.user_id = ca.assigned_to
         GROUP BY ca.assigned_to, ms.staff_code, ms.workload_count, u.full_name`,
        { type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    // Count per status with direct Complaint.count (avoids GROUP BY direction issues)
    const statusCounts = await Promise.all(
      allStatuses.map(async (s) => ({
        status_name: s.status_name,
        count: await Complaint.count({ where: { ...submittedWhere, status_id: s.status_id } }),
      }))
    );
    const statusMap = {};
    statusCounts.forEach(({ status_name, count }) => {
      statusMap[status_name.toLowerCase().replace(' ', '_')] = count;
    });

    return res.json({
      total,
      stats: {
        open: statusMap.open || 0,
        assigned: statusMap.assigned || 0,
        in_progress: statusMap.in_progress || 0,
        resolved: statusMap.resolved || 0,
        closed: statusMap.closed || 0,
        avg_resolution_hours: avgRes[0]?.avg_hours
          ? Math.round(Number(avgRes[0].avg_hours) * 10) / 10
          : null,
      },
      byCategory: byCategory.map((r) => ({
        label: r.Category?.category_name || 'Unknown',
        value: Number(r.dataValues.count),
      })),
      byPriority: byPriority.map((r) => ({
        label: r.priority?.priority_name || 'Unknown',
        value: Number(r.dataValues.count),
      })),
      staffPerformance: staffPerf.map((r) => ({
        staff_name: r.full_name,
        staff_code: r.staff_code,
        total_assigned: Number(r.total_assigned),
        current_workload: r.workload_count,
      })),
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ message: 'Failed to fetch analytics' });
  }
}

// ─── Admin: create resolution record + close complaint ────────────────────────

async function createResolution(req, res) {
  const { id } = req.params;
  const { resolution_summary } = req.body;

  const t = await sequelize.transaction();
  try {
    const complaint = await Complaint.findByPk(id, {
      include: [
        { model: ComplaintStatus, as: 'status' },
        { model: ComplaintAssignment, required: false },
      ],
    });
    if (!complaint) { await t.rollback(); return res.status(404).json({ message: 'Complaint not found' }); }

    if (complaint.status.status_name !== 'Resolved') {
      await t.rollback();
      return res.status(400).json({ message: 'Complaint must be Resolved before generating a resolution record' });
    }

    const existing = await Resolution.findOne({ where: { complaint_id: id } });
    if (existing) { await t.rollback(); return res.status(409).json({ message: 'Resolution already exists' }); }

    const resolvedBy = complaint.ComplaintAssignment?.assigned_to;
    if (!resolvedBy) { await t.rollback(); return res.status(400).json({ message: 'No staff assigned to this complaint' }); }

    const now = new Date();
    const resolution = await Resolution.create(
      {
        complaint_id: id,
        resolved_by: resolvedBy,
        resolution_summary: resolution_summary.trim(),
        resolution_date: now.toISOString().split('T')[0],
        resolved_at: now,
      },
      { transaction: t }
    );

    const closedStatus = await ComplaintStatus.findOne({ where: { status_name: 'Closed' } });
    const oldStatusId = complaint.status_id;
    complaint.status_id = closedStatus.status_id;
    await complaint.save({ transaction: t });

    await StatusHistory.create(
      {
        complaint_id: id,
        old_status_id: oldStatusId,
        new_status_id: closedStatus.status_id,
        changed_by: req.user.user_id,
        remarks: 'Resolution generated and complaint closed',
      },
      { transaction: t }
    );

    await t.commit();
    await writeAudit(req.user.user_id, 'create_resolution', 'resolutions', { complaint_id: id });
    return res.status(201).json({ message: 'Resolution created and complaint closed', resolution });
  } catch (err) {
    await t.rollback();
    console.error('Create resolution error:', err);
    return res.status(500).json({ message: 'Failed to create resolution' });
  }
}

// ─── Get full resolution report for a complaint ───────────────────────────────

async function getResolutionReport(req, res) {
  const { id } = req.params;
  try {
    const complaint = await Complaint.findByPk(id, {
      include: [
        { model: ComplaintStatus, as: 'status', attributes: ['status_name'] },
        { model: Category, attributes: ['category_name'] },
        { model: PriorityLevel, as: 'priority', attributes: ['priority_name'] },
        {
          model: Location,
          attributes: ['room_no', 'floor_no'],
          include: [{ model: Building, attributes: ['building_name'] }],
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['full_name', 'email'],
          include: [{ model: EndUser, attributes: ['university_id', 'user_type'], required: false }],
        },
        {
          model: ComplaintAssignment,
          required: false,
          include: [{
            model: MaintenanceStaff,
            as: 'assignee',
            attributes: ['staff_code'],
            include: [{ model: User, attributes: ['full_name'] }],
          }],
        },
        {
          model: Resolution,
          required: false,
          include: [{
            model: MaintenanceStaff,
            as: 'resolver',
            attributes: ['staff_code'],
            include: [{ model: User, attributes: ['full_name'] }],
          }],
        },
        {
          model: WorkLog,
          include: [{
            model: MaintenanceStaff,
            as: 'staff',
            include: [{ model: User, attributes: ['full_name'] }],
          }],
          separate: true,
          order: [['logged_at', 'ASC']],
        },
        {
          model: ComplaintImage,
          include: [{ model: AttachmentType, attributes: ['type_name'] }],
          separate: true,
          order: [['uploaded_at', 'ASC']],
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
        { model: Feedback, required: false },
      ],
    });

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    return res.json({ report: complaint });
  } catch (err) {
    console.error('Get report error:', err);
    return res.status(500).json({ message: 'Failed to fetch report' });
  }
}

// ─── List resolved/closed complaints ─────────────────────────────────────────

async function listResolved(req, res) {
  const { from, to, page = 1 } = req.query;
  const limit = 20;
  const offset = (Number(page) - 1) * limit;

  try {
    const [resolvedStatus, closedStatus] = await Promise.all([
      ComplaintStatus.findOne({ where: { status_name: 'Resolved' } }),
      ComplaintStatus.findOne({ where: { status_name: 'Closed' } }),
    ]);

    const where = {
      status_id: { [Op.in]: [resolvedStatus?.status_id, closedStatus?.status_id].filter(Boolean) },
    };
    if (from || to) {
      where.submitted_at = {};
      if (from) where.submitted_at[Op.gte] = new Date(from);
      if (to)   where.submitted_at[Op.lte] = new Date(to);
    }

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        { model: ComplaintStatus, as: 'status', attributes: ['status_name'] },
        { model: Category, attributes: ['category_name'] },
        { model: User, as: 'submitter', attributes: ['full_name'] },
        {
          model: ComplaintAssignment,
          required: false,
          include: [{
            model: MaintenanceStaff,
            as: 'assignee',
            include: [{ model: User, attributes: ['full_name'] }],
          }],
        },
        { model: Resolution, required: false },
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
    console.error('List resolved error:', err);
    return res.status(500).json({ message: 'Failed to fetch resolved complaints' });
  }
}

module.exports = { getAnalytics, createResolution, getResolutionReport, listResolved };
