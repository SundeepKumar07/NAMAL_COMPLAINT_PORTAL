const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Comment = sequelize.define(
  'Comment',
  {
    comment_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    complaint_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    comment_type: {
      type: DataTypes.ENUM('user', 'staff', 'admin', 'system'),
      defaultValue: 'user',
    },
    comment_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'comments',
    timestamps: false,
  }
);

module.exports = Comment;
