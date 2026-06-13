const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ComplaintAssignment = sequelize.define(
  'ComplaintAssignment',
  {
    assignment_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    complaint_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'complaint_assignments',
    timestamps: false,
  }
);

module.exports = ComplaintAssignment;
