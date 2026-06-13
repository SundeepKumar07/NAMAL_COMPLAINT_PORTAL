const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Building = sequelize.define(
  'Building',
  {
    building_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    building_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    campus_area: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    floors: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'buildings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Building;
