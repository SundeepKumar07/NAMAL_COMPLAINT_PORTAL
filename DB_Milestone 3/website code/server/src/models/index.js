const sequelize = require('../config/db');
const User = require('./User');
const Department = require('./Department');
const EndUser = require('./EndUser');
const Admin = require('./Admin');
const MaintenanceStaff = require('./MaintenanceStaff');
const StaffSpecialization = require('./StaffSpecialization');
const Building = require('./Building');
const Location = require('./Location');
const Category = require('./Category');
const PriorityLevel = require('./PriorityLevel');
const ComplaintStatus = require('./ComplaintStatus');
const Complaint = require('./Complaint');
const AttachmentType = require('./AttachmentType');
const ComplaintImage = require('./ComplaintImage');
const ComplaintAssignment = require('./ComplaintAssignment');
const StatusHistory = require('./StatusHistory');
const WorkLog = require('./WorkLog');
const Resolution = require('./Resolution');
const Comment = require('./Comment');
const Feedback = require('./Feedback');
const NotificationTemplate = require('./NotificationTemplate');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');

// User hierarchy
User.hasOne(EndUser, { foreignKey: 'user_id', onDelete: 'CASCADE' });
EndUser.belongsTo(User, { foreignKey: 'user_id' });
EndUser.belongsTo(Department, { foreignKey: 'department_id' });
Department.hasMany(EndUser, { foreignKey: 'department_id' });

User.hasOne(Admin, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Admin.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(MaintenanceStaff, { foreignKey: 'user_id', onDelete: 'CASCADE' });
MaintenanceStaff.belongsTo(User, { foreignKey: 'user_id' });

MaintenanceStaff.hasMany(StaffSpecialization, { foreignKey: 'staff_id', onDelete: 'CASCADE' });
StaffSpecialization.belongsTo(MaintenanceStaff, { foreignKey: 'staff_id' });
StaffSpecialization.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(StaffSpecialization, { foreignKey: 'category_id' });

// Infrastructure
Building.hasMany(Location, { foreignKey: 'building_id', onDelete: 'CASCADE' });
Location.belongsTo(Building, { foreignKey: 'building_id' });

// Complaints
User.hasMany(Complaint, { foreignKey: 'submitted_by', as: 'submittedComplaints' });
Complaint.belongsTo(User, { foreignKey: 'submitted_by', as: 'submitter' });
Complaint.belongsTo(Category, { foreignKey: 'category_id' });
Complaint.belongsTo(ComplaintStatus, { foreignKey: 'status_id', as: 'status' });
Complaint.belongsTo(PriorityLevel, { foreignKey: 'priority_id', as: 'priority' });
Complaint.belongsTo(Location, { foreignKey: 'location_id' });

Complaint.hasMany(ComplaintImage, { foreignKey: 'complaint_id', onDelete: 'CASCADE' });
ComplaintImage.belongsTo(Complaint, { foreignKey: 'complaint_id' });
ComplaintImage.belongsTo(AttachmentType, { foreignKey: 'attachment_type_id' });
ComplaintImage.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

Complaint.hasOne(ComplaintAssignment, { foreignKey: 'complaint_id', onDelete: 'CASCADE' });
ComplaintAssignment.belongsTo(Complaint, { foreignKey: 'complaint_id' });
ComplaintAssignment.belongsTo(MaintenanceStaff, { foreignKey: 'assigned_to', as: 'assignee' });
ComplaintAssignment.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' });

Complaint.hasMany(StatusHistory, { foreignKey: 'complaint_id', onDelete: 'CASCADE' });
StatusHistory.belongsTo(Complaint, { foreignKey: 'complaint_id' });
StatusHistory.belongsTo(ComplaintStatus, { foreignKey: 'old_status_id', as: 'oldStatus' });
StatusHistory.belongsTo(ComplaintStatus, { foreignKey: 'new_status_id', as: 'newStatus' });
StatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changer' });

Complaint.hasMany(WorkLog, { foreignKey: 'complaint_id', onDelete: 'CASCADE' });
WorkLog.belongsTo(Complaint, { foreignKey: 'complaint_id' });
WorkLog.belongsTo(MaintenanceStaff, { foreignKey: 'staff_id', as: 'staff' });

Complaint.hasOne(Resolution, { foreignKey: 'complaint_id', onDelete: 'CASCADE' });
Resolution.belongsTo(Complaint, { foreignKey: 'complaint_id' });
Resolution.belongsTo(MaintenanceStaff, { foreignKey: 'resolved_by', as: 'resolver' });

Complaint.hasMany(Comment, { foreignKey: 'complaint_id', onDelete: 'CASCADE' });
Comment.belongsTo(Complaint, { foreignKey: 'complaint_id' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

Complaint.hasOne(Feedback, { foreignKey: 'complaint_id', onDelete: 'CASCADE' });
Feedback.belongsTo(Complaint, { foreignKey: 'complaint_id' });
Feedback.belongsTo(User, { foreignKey: 'user_id', as: 'reviewer' });

User.hasMany(Notification, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id' });
Notification.belongsTo(Complaint, { foreignKey: 'complaint_id' });
Notification.belongsTo(NotificationTemplate, { foreignKey: 'template_id' });

User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Department,
  EndUser,
  Admin,
  MaintenanceStaff,
  StaffSpecialization,
  Building,
  Location,
  Category,
  PriorityLevel,
  ComplaintStatus,
  Complaint,
  AttachmentType,
  ComplaintImage,
  ComplaintAssignment,
  StatusHistory,
  WorkLog,
  Resolution,
  Comment,
  Feedback,
  NotificationTemplate,
  Notification,
  AuditLog,
};
