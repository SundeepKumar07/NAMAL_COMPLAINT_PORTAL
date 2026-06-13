const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define(
  'Notification',
  {
    notification_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    complaint_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    template_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'notifications',
    timestamps: false,
  }
);

module.exports = Notification;
