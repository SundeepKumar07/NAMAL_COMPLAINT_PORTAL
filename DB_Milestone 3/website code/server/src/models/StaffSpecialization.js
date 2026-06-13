const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StaffSpecialization = sequelize.define(
  'StaffSpecialization',
  {
    staff_spec_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    staff_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    proficiency_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'expert'),
      defaultValue: 'intermediate',
    },
  },
  {
    tableName: 'staff_specializations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = StaffSpecialization;
