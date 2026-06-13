const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    audit_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    action_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    affected_table: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    action_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: false,
  }
);

module.exports = AuditLog;
