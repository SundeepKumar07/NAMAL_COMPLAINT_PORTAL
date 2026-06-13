const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MaintenanceStaff = sequelize.define(
  'MaintenanceStaff',
  {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    staff_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    availability_status: {
      type: DataTypes.ENUM('available', 'busy', 'off_duty'),
      defaultValue: 'available',
    },
    workload_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'maintenance_staff',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = MaintenanceStaff;
