const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ComplaintStatus = sequelize.define(
  'ComplaintStatus',
  {
    status_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status_name: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'complaint_statuses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = ComplaintStatus;
