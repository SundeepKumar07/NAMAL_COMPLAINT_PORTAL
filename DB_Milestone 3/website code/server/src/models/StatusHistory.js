const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StatusHistory = sequelize.define(
  'StatusHistory',
  {
    history_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    complaint_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    old_status_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    new_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    changed_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'status_history',
    timestamps: false,
  }
);

module.exports = StatusHistory;
