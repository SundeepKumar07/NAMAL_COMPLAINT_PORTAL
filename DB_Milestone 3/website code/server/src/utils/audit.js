const { AuditLog } = require('../models');

async function writeAudit(userId, actionType, affectedTable, details = null) {
  try {
    await AuditLog.create({
      user_id: userId,
      action_type: actionType,
      affected_table: affectedTable,
      details,
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
}

module.exports = { writeAudit };
