const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WorkLog = sequelize.define(
  'WorkLog',
  {
    worklog_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    complaint_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    staff_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    work_note: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    logged_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'work_logs',
    timestamps: false,
  }
);

module.exports = WorkLog;
