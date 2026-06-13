/**
 * Phase 3/5 — Feedback (end_user submits rating after resolution)
 */
const { Feedback, Complaint, ComplaintStatus } = require('../models');
const { writeAudit } = require('../utils/audit');

async function submitFeedback(req, res) {
  const { id } = req.params; // complaint_id
  const { rating, feedback_text } = req.body;

  try {
    const complaint = await Complaint.findByPk(id, {
      include: [{ model: ComplaintStatus, as: 'status' }],
    });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.submitted_by !== req.user.user_id) {
      return res.status(403).json({ message: 'You can only rate your own complaints' });
    }

    if (!['Resolved', 'Closed'].includes(complaint.status.status_name)) {
      return res.status(400).json({ message: 'Feedback can only be submitted for resolved or closed complaints' });
    }

    const existing = await Feedback.findOne({ where: { complaint_id: id } });
    if (existing) return res.status(409).json({ message: 'Feedback already submitted for this complaint' });

    const feedback = await Feedback.create({
      complaint_id: id,
      user_id: req.user.user_id,
      rating: Number(rating),
      feedback_text: feedback_text?.trim() || null,
    });

    await writeAudit(req.user.user_id, 'submit_feedback', 'feedbacks', { complaint_id: id, rating });
    return res.status(201).json({ message: 'Feedback submitted', feedback });
  } catch (err) {
    console.error('Submit feedback error:', err);
    return res.status(500).json({ message: 'Failed to submit feedback' });
  }
}

async function getFeedback(req, res) {
  const { id } = req.params;
  try {
    const feedback = await Feedback.findOne({ where: { complaint_id: id } });
    return res.json({ feedback: feedback || null });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch feedback' });
  }
}

module.exports = { submitFeedback, getFeedback };
