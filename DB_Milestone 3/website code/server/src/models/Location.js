const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Location = sequelize.define(
  'Location',
  {
    location_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    building_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    room_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    floor_no: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'locations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Location;
