const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PriorityLevel = sequelize.define(
  'PriorityLevel',
  {
    priority_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    priority_name: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    response_time_hours: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hours_resolution: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'priority_levels',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = PriorityLevel;
