const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AttachmentType = sequelize.define(
  'AttachmentType',
  {
    attachment_type_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'attachment_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = AttachmentType;
