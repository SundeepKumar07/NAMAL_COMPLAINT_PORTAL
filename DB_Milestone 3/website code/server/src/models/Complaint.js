const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Complaint = sequelize.define(
  'Complaint',
  {
    complaint_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticket_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expected_resolution_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    submitted_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    priority_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'complaints',
    timestamps: true,
    createdAt: 'submitted_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Complaint;
