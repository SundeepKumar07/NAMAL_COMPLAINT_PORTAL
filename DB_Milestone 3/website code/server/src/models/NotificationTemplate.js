const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const NotificationTemplate = sequelize.define(
  'NotificationTemplate',
  {
    template_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    template_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    template_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'notification_templates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = NotificationTemplate;
