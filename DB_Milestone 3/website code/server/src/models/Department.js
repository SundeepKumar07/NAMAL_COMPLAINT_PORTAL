const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Department = sequelize.define(
  'Department',
  {
    department_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    department_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    faculty_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: 'departments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Department;
