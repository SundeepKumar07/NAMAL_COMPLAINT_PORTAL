/**
 * Phase 3 — Staff panel: status update, work log, image upload
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  sequelize,
  Complaint,
  ComplaintAssignment,
  ComplaintStatus,
  StatusHistory,
  WorkLog,
  ComplaintImage,
  AttachmentType,
  MaintenanceStaff,
  User,
  Category,
  Location,
  Building,
  Comment,
} = require('../models');
const { writeAudit } = require('../utils/audit');
const { notify } = require('../utils/notify');
const { uploadBuffer } = require('../utils/cloudinary');

// ─── Image save helper ────────────────────────────────────────────────────────

function hasCloudinary() {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key'
  );
}

async function saveImage(file, subfolder) {
  if (hasCloudinary()) return uploadBuffer(file.buffer, subfolder);
  const hash = crypto.createHash('sha1').update(file.buffer).digest('hex').slice(0, 16);
  const ext = file.mimetype.split('/')[1] || 'jpg';
  const uploadDir = path.join(__dirname, '../../../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, `${hash}.${ext}`), file.buffer);
  return `/uploads/${hash}.${ext}`;
}

// ─── Staff: update status (In Progress / Resolved only) ──────────────────────

async function staffUpdateStatus(req, res) {
  const { id } = req.params;
  const { status_name, remarks } = req.body;

  if (!['In Progress', 'Resolved'].includes(status_name)) {
    return res.status(400).json({ message: 'Staff may only set In Progress or Resolved' });
  }

  const t = await sequelize.transaction();
  try {
    const complaint = await Complaint.findByPk(id, {
      include: [
        { model: ComplaintStatus, as: 'status' },
        { model: ComplaintAssignment, required: false },
      ],
    });
    if (!complaint) { await t.rollback(); return res.status(404).json({ message: 'Complaint not found' }); }

    if (complaint.ComplaintAssignment?.assigned_to !== req.user.user_id) {
      await t.rollback();
      return res.status(403).json({ message: 'This complaint is not assigned to you' });
    }

    const newStatus = await ComplaintStatus.findOne({ where: { status_name }, transaction: t });
    if (!newStatus) { await t.rollback(); return res.status(400).json({ message: 'Invalid status' }); }

    const oldStatusId = complaint.status_id;
    complaint.status_id = newStatus.status_id;
    await complaint.save({ transaction: t });

    await StatusHistory.create(
      {
        complaint_id: id,
        old_status_id: oldStatusId,
        new_status_id: newStatus.status_id,
        changed_by: req.user.user_id,
        remarks: remarks?.trim() || null,
      },
      { transaction: t }
    );

    if (status_name === 'Resolved') {
      await MaintenanceStaff.decrement('workload_count', {
        where: { user_id: req.user.user_id },
        transaction: t,
      });
    }

    await t.commit();

    await notify(
      complaint.submitted_by,
      `Your complaint "${complaint.title}" status changed to ${status_name}.`,
      id
    );
    await writeAudit(req.user.user_id, 'staff_update_status', 'complaints', { complaint_id: id, status_name });
    return res.json({ message: `Status updated to ${status_name}` });
  } catch (err) {
    await t.rollback();
    console.error('Staff update status error:', err);
    return res.status(500).json({ message: 'Failed to update status' });
  }
}

// ─── Staff: add work log ──────────────────────────────────────────────────────

async function addWorkLog(req, res) {
  const { id } = req.params;
  const { work_note } = req.body;

  try {
    const complaint = await Complaint.findByPk(id, {
      include: [{ model: ComplaintAssignment, required: false }],
    });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.ComplaintAssignment?.assigned_to !== req.user.user_id) {
      return res.status(403).json({ message: 'This complaint is not assigned to you' });
    }

    const log = await WorkLog.create({
      complaint_id: id,
      staff_id: req.user.user_id,
      work_note: work_note.trim(),
    });

    return res.status(201).json({ message: 'Work log added', workLog: log });
  } catch (err) {
    console.error('Add work log error:', err);
    return res.status(500).json({ message: 'Failed to add work log' });
  }
}

// ─── Staff: upload progress images ───────────────────────────────────────────

async function uploadProgressImages(req, res) {
  const { id } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No images provided' });
  }

  try {
    const complaint = await Complaint.findByPk(id, {
      include: [{ model: ComplaintAssignment, required: false }],
    });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.ComplaintAssignment?.assigned_to !== req.user.user_id) {
      return res.status(403).json({ message: 'This complaint is not assigned to you' });
    }

    const attachType = await AttachmentType.findOne({ where: { type_name: 'resolution_photo' } });

    const created = await Promise.all(
      files.map(async (file) => {
        const url = await saveImage(file, 'progress');
        return ComplaintImage.create({
          complaint_id: id,
          attachment_type_id: attachType?.attachment_type_id || 2,
          uploaded_by: req.user.user_id,
          image_url: url,
        });
      })
    );

    await writeAudit(req.user.user_id, 'upload_images', 'complaint_images', {
      complaint_id: id,
      count: created.length,
    });

    return res.status(201).json({ message: `${created.length} image(s) uploaded`, images: created });
  } catch (err) {
    console.error('Upload images error:', err);
    return res.status(500).json({ message: 'Failed to upload images' });
  }
}

// ─── Staff: get full task detail ──────────────────────────────────────────────

async function getMyTask(req, res) {
  const { id } = req.params;
  try {
    const complaint = await Complaint.findByPk(id, {
      include: [
        { model: ComplaintStatus, as: 'status' },
        { model: Category },
        { model: Location, include: [{ model: Building }] },
        {
          model: ComplaintAssignment,
          required: false,
          include: [{ model: MaintenanceStaff, as: 'assignee', include: [{ model: User, attributes: ['full_name'] }] }],
        },
        {
          model: WorkLog,
          include: [{ model: MaintenanceStaff, as: 'staff', include: [{ model: User, attributes: ['full_name'] }] }],
          separate: true,
          order: [['logged_at', 'ASC']],
        },
        {
          model: ComplaintImage,
          include: [{ model: AttachmentType }],
          separate: true,
          order: [['uploaded_at', 'ASC']],
        },
        {
          model: Comment,
          include: [{ model: User, as: 'author', attributes: ['full_name', 'role_type'] }],
          separate: true,
          order: [['comment_at', 'ASC']],
        },
        {
          model: StatusHistory,
          include: [
            { model: ComplaintStatus, as: 'oldStatus', attributes: ['status_name'] },
            { model: ComplaintStatus, as: 'newStatus', attributes: ['status_name'] },
            { model: User, as: 'changer', attributes: ['full_name'] },
          ],
          separate: true,
          order: [['changed_at', 'ASC']],
        },
      ],
    });

    if (!complaint) return res.status(404).json({ message: 'Not found' });
    if (complaint.ComplaintAssignment?.assigned_to !== req.user.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json({ complaint });
  } catch (err) {
    console.error('Get task error:', err);
    return res.status(500).json({ message: 'Failed to fetch task' });
  }
}

module.exports = { staffUpdateStatus, addWorkLog, uploadProgressImages, getMyTask };
