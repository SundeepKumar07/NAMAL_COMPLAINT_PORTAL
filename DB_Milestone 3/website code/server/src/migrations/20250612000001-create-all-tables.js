'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      user_id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      full_name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: false },
      phone_no: { type: Sequelize.STRING(20), allowNull: true },
      account_status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
      },
      role_type: {
        type: Sequelize.ENUM('end_user', 'maintenance_staff', 'admin'),
        allowNull: false,
      },
      profile_picture: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('departments', {
      department_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      department_name: { type: Sequelize.STRING(100), allowNull: false },
      faculty_name: { type: Sequelize.STRING(100), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('end_users', {
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'departments', key: 'department_id' },
        onDelete: 'SET NULL',
      },
      user_type: {
        type: Sequelize.ENUM('student', 'faculty', 'staff'),
        allowNull: false,
      },
      university_id: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('admins', {
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      access_level: {
        type: Sequelize.ENUM('superadmin', 'system_admin'),
        defaultValue: 'system_admin',
      },
      designation: { type: Sequelize.STRING(100), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('maintenance_staff', {
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      staff_code: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      availability_status: {
        type: Sequelize.ENUM('available', 'busy', 'off_duty'),
        defaultValue: 'available',
      },
      workload_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('categories', {
      category_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      category_name: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('staff_specializations', {
      staff_spec_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      staff_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'maintenance_staff', key: 'user_id' },
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'categories', key: 'category_id' },
        onDelete: 'CASCADE',
      },
      proficiency_level: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'expert'),
        defaultValue: 'intermediate',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('buildings', {
      building_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      building_name: { type: Sequelize.STRING(100), allowNull: false },
      campus_area: { type: Sequelize.STRING(100), allowNull: true },
      floors: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('locations', {
      location_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      building_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'buildings', key: 'building_id' },
        onDelete: 'CASCADE',
      },
      room_no: { type: Sequelize.STRING(50), allowNull: false },
      floor_no: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('priority_levels', {
      priority_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      priority_name: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(255), allowNull: true },
      response_time_hours: { type: Sequelize.INTEGER, allowNull: false },
      hours_resolution: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('complaint_statuses', {
      status_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      status_name: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('complaints', {
      complaint_id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      ticket_id: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      expected_resolution_date: { type: Sequelize.DATE, allowNull: true },
      submitted_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'RESTRICT',
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'categories', key: 'category_id' },
        onDelete: 'RESTRICT',
      },
      status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'complaint_statuses', key: 'status_id' },
        onDelete: 'RESTRICT',
      },
      priority_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'priority_levels', key: 'priority_id' },
        onDelete: 'RESTRICT',
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'locations', key: 'location_id' },
        onDelete: 'RESTRICT',
      },
      submitted_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('attachment_types', {
      attachment_type_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      type_name: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('complaint_images', {
      image_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'complaints', key: 'complaint_id' },
        onDelete: 'CASCADE',
      },
      attachment_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'attachment_types', key: 'attachment_type_id' },
        onDelete: 'RESTRICT',
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'RESTRICT',
      },
      image_url: { type: Sequelize.STRING(500), allowNull: false },
      uploaded_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('complaint_assignments', {
      assignment_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'complaints', key: 'complaint_id' },
        onDelete: 'CASCADE',
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'maintenance_staff', key: 'user_id' },
        onDelete: 'RESTRICT',
      },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'RESTRICT',
      },
      assigned_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('status_history', {
      history_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'complaints', key: 'complaint_id' },
        onDelete: 'CASCADE',
      },
      old_status_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'complaint_statuses', key: 'status_id' },
        onDelete: 'RESTRICT',
      },
      new_status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'complaint_statuses', key: 'status_id' },
        onDelete: 'RESTRICT',
      },
      changed_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'RESTRICT',
      },
      remarks: { type: Sequelize.STRING(500), allowNull: true },
      changed_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('work_logs', {
      worklog_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'complaints', key: 'complaint_id' },
        onDelete: 'CASCADE',
      },
      staff_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'maintenance_staff', key: 'user_id' },
        onDelete: 'RESTRICT',
      },
      work_note: { type: Sequelize.TEXT, allowNull: false },
      logged_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('resolutions', {
      resolution_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'complaints', key: 'complaint_id' },
        onDelete: 'CASCADE',
      },
      resolved_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'maintenance_staff', key: 'user_id' },
        onDelete: 'RESTRICT',
      },
      resolved_at: { type: Sequelize.DATE, allowNull: false },
      resolution_summary: { type: Sequelize.TEXT, allowNull: false },
      resolution_date: { type: Sequelize.DATEONLY, allowNull: false },
    });

    await queryInterface.createTable('comments', {
      comment_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'complaints', key: 'complaint_id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'RESTRICT',
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      comment_type: {
        type: Sequelize.ENUM('user', 'staff', 'admin', 'system'),
        defaultValue: 'user',
      },
      comment_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('feedbacks', {
      feedback_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'complaints', key: 'complaint_id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'RESTRICT',
      },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      feedback_text: { type: Sequelize.TEXT, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('notification_templates', {
      template_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      template_name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      template_text: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('notifications', {
      notification_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'CASCADE',
      },
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'complaints', key: 'complaint_id' },
        onDelete: 'CASCADE',
      },
      template_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'notification_templates', key: 'template_id' },
        onDelete: 'SET NULL',
      },
      message: { type: Sequelize.TEXT, allowNull: false },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('audit_logs', {
      audit_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'SET NULL',
      },
      action_type: { type: Sequelize.STRING(50), allowNull: false },
      affected_table: { type: Sequelize.STRING(50), allowNull: true },
      action_time: { type: Sequelize.DATE, allowNull: false },
      details: { type: Sequelize.JSON, allowNull: true },
    });

    // Indexes
    await queryInterface.addIndex('complaints', ['submitted_by']);
    await queryInterface.addIndex('complaints', ['status_id']);
    await queryInterface.addIndex('complaints', ['category_id']);
    await queryInterface.addIndex('complaints', ['priority_id']);
    await queryInterface.addIndex('complaints', ['submitted_at']);
    await queryInterface.addIndex('status_history', ['complaint_id']);
    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
    await queryInterface.addIndex('complaint_assignments', ['assigned_to']);
    await queryInterface.addIndex('audit_logs', ['user_id', 'action_time']);
  },

  async down(queryInterface) {
    const tables = [
      'audit_logs', 'notifications', 'notification_templates', 'feedbacks', 'comments',
      'resolutions', 'work_logs', 'status_history', 'complaint_assignments', 'complaint_images',
      'attachment_types', 'complaints', 'complaint_statuses', 'priority_levels', 'locations',
      'buildings', 'staff_specializations', 'categories', 'maintenance_staff', 'admins',
      'end_users', 'departments', 'users',
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
  },
};
