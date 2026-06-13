const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ComplaintImage = sequelize.define(
  'ComplaintImage',
  {
    image_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    complaint_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    attachment_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'complaint_images',
    timestamps: false,
  }
);

module.exports = ComplaintImage;
