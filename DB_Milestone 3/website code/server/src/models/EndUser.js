const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EndUser = sequelize.define(
  'EndUser',
  {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_type: {
      type: DataTypes.ENUM('student', 'faculty', 'staff'),
      allowNull: false,
    },
    university_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'end_users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = EndUser;
