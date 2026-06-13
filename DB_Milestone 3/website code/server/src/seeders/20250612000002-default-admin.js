'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const now = new Date();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      "SELECT user_id FROM users WHERE role_type = 'admin' LIMIT 1"
    );
    if (existing.length > 0) return;

    const adminId = uuidv4();
    const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const hashed = await bcrypt.hash(password, 10);

    await queryInterface.bulkInsert('users', [
      {
        user_id: adminId,
        full_name: process.env.SEED_ADMIN_NAME || 'System Administrator',
        email: (process.env.SEED_ADMIN_EMAIL || 'admin@namal.edu.pk').toLowerCase(),
        password: hashed,
        phone_no: null,
        account_status: 'active',
        role_type: 'admin',
        profile_picture: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('admins', [
      {
        user_id: adminId,
        access_level: 'superadmin',
        designation: 'System Administrator',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const email = (process.env.SEED_ADMIN_EMAIL || 'admin@namal.edu.pk').toLowerCase();
    const [rows] = await queryInterface.sequelize.query(
      `SELECT user_id FROM users WHERE email = '${email}' LIMIT 1`
    );
    if (rows.length === 0) return;
    const adminId = rows[0].user_id;
    await queryInterface.bulkDelete('admins', { user_id: adminId }, {});
    await queryInterface.bulkDelete('users', { user_id: adminId }, {});
  },
};
