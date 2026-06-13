const { Complaint } = require('../models');

/**
 * Generates next ticket ID in format NCMMS-YYYY-NNNN
 * Thread-safe: counts existing tickets for the current year.
 */
async function generateTicketId() {
  const year = new Date().getFullYear();
  const prefix = `NCMMS-${year}-`;

  const count = await Complaint.count({
    where: { ticket_id: { [require('sequelize').Op.like]: `${prefix}%` } },
  });

  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}${seq}`;
}

module.exports = { generateTicketId };
