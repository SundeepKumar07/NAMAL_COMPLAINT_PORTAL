const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = sequelize.define(
  'Admin',
  {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    access_level: {
      type: DataTypes.ENUM('superadmin', 'system_admin'),
      defaultValue: 'system_admin',
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: 'admins',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Admin;
