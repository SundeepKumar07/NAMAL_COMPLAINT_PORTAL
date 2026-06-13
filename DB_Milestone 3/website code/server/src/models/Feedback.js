const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Feedback = sequelize.define(
  'Feedback',
  {
    feedback_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    complaint_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    feedback_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submitted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'feedbacks',
    timestamps: false,
  }
);

module.exports = Feedback;
