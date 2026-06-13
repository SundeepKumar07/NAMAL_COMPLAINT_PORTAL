const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Resolution = sequelize.define(
  'Resolution',
  {
    resolution_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    complaint_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    resolved_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    resolved_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    resolution_summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    resolution_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: 'resolutions',
    timestamps: false,
  }
);

module.exports = Resolution;
