CREATE DATABASE IF NOT EXISTS namal_complaints;
USE namal_complaints;

-- Turn off checks to safely wipe and reset definitions cleanly 
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_templates;
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS resolutions;
DROP TABLE IF EXISTS work_logs;
DROP TABLE IF EXISTS status_history;
DROP TABLE IF EXISTS complaint_images;
DROP TABLE IF EXISTS complaint_assignments;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS attachment_types;
DROP TABLE IF EXISTS priority_levels;
DROP TABLE IF EXISTS complaint_statuses;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS buildings;
DROP TABLE IF EXISTS staff_specializations;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS maintenance_staff;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS end_users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. USER PLATFORM HIERARCHY TABLES
-- ============================================================================

-- Ref: User Model (timestamps: true)
CREATE TABLE users (
    user_id CHAR(36) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_no VARCHAR(20) NULL,
    account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    role_type ENUM('end_user', 'maintenance_staff', 'admin') NOT NULL,
    profile_picture VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_users_email (email)
);

-- Ref: Department Model (timestamps: true)
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    faculty_name VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (department_id)
);

-- Ref: EndUser Model (timestamps: true)
CREATE TABLE end_users (
    user_id CHAR(36) NOT NULL,
    department_id INT NULL,
    user_type ENUM('student', 'faculty', 'staff') NOT NULL,
    university_id VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_end_users_university_id (university_id),
    CONSTRAINT fk_end_users_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_end_users_dept FOREIGN KEY (department_id) REFERENCES departments (department_id) ON DELETE SET NULL
);

-- Ref: Admin Model (timestamps: true)
CREATE TABLE admins (
    user_id CHAR(36) NOT NULL,
    access_level ENUM('superadmin', 'system_admin') DEFAULT 'system_admin',
    designation VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Ref: MaintenanceStaff Model (timestamps: true)
CREATE TABLE maintenance_staff (
    user_id CHAR(36) NOT NULL,
    staff_code VARCHAR(30) NOT NULL,
    availability_status ENUM('available', 'busy', 'off_duty') DEFAULT 'available',
    workload_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_staff_code (staff_code),
    CONSTRAINT fk_maintenance_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- ============================================================================
-- 2. METADATA CONFIGURATION TABLES
-- ============================================================================

-- Ref: Category Model (timestamps: true)
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT NOT NULL,
    category_name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id),
    UNIQUE KEY uk_category_name (category_name)
);

-- Ref: StaffSpecialization Model (timestamps: true)
CREATE TABLE staff_specializations (
    staff_spec_id INT AUTO_INCREMENT NOT NULL,
    staff_id CHAR(36) NOT NULL,
    category_id INT NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'expert') DEFAULT 'intermediate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (staff_spec_id),
    CONSTRAINT fk_spec_staff FOREIGN KEY (staff_id) REFERENCES maintenance_staff (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_spec_category FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE CASCADE
);

-- Ref: Building Model (timestamps: true)
CREATE TABLE buildings (
    building_id INT AUTO_INCREMENT NOT NULL,
    building_name VARCHAR(100) NOT NULL,
    campus_area VARCHAR(100) NULL,
    floors INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (building_id)
);

-- Ref: Location Model (timestamps: true)
CREATE TABLE locations (
    location_id INT AUTO_INCREMENT NOT NULL,
    building_id INT NOT NULL,
    room_no VARCHAR(50) NOT NULL,
    floor_no INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (location_id),
    CONSTRAINT fk_locations_building FOREIGN KEY (building_id) REFERENCES buildings (building_id) ON DELETE CASCADE
);

-- Ref: ComplaintStatus Model (timestamps: true)
CREATE TABLE complaint_statuses (
    status_id INT AUTO_INCREMENT NOT NULL,
    status_name VARCHAR(30) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (status_id),
    UNIQUE KEY uk_status_name (status_name)
);

-- Ref: PriorityLevel Model (timestamps: true)
CREATE TABLE priority_levels (
    priority_id INT AUTO_INCREMENT NOT NULL,
    priority_name VARCHAR(30) NOT NULL,
    description VARCHAR(255) NULL,
    response_time_hours INT NOT NULL,
    hours_resolution INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (priority_id),
    UNIQUE KEY uk_priority_name (priority_name)
);

-- Ref: AttachmentType Model (timestamps: true)
CREATE TABLE attachment_types (
    attachment_type_id INT AUTO_INCREMENT NOT NULL,
    type_name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_type_id),
    UNIQUE KEY uk_attachment_type_name (type_name)
);

-- ============================================================================
-- 3. CORE CORE CORE CORE TICKETS & TRANSACTIONS
-- ============================================================================

-- Ref: Complaint Model (timestamps: true, custom names mapped safely)
CREATE TABLE complaints (
    complaint_id CHAR(36) NOT NULL,
    ticket_id VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    expected_resolution_date DATETIME NULL,
    submitted_by CHAR(36) NOT NULL,
    category_id INT NOT NULL,
    status_id INT NOT NULL,
    priority_id INT NOT NULL,
    location_id INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (complaint_id),
    UNIQUE KEY uk_complaint_ticket (ticket_id),
    CONSTRAINT fk_complaints_submitter FOREIGN KEY (submitted_by) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_complaints_category FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_complaints_status FOREIGN KEY (status_id) REFERENCES complaint_statuses (status_id) ON DELETE RESTRICT,
    CONSTRAINT fk_complaints_priority FOREIGN KEY (priority_id) REFERENCES priority_levels (priority_id) ON DELETE RESTRICT,
    CONSTRAINT fk_complaints_location FOREIGN KEY (location_id) REFERENCES locations (location_id) ON DELETE RESTRICT
);

-- Ref: ComplaintAssignment Model (timestamps: false)
CREATE TABLE complaint_assignments (
    assignment_id INT AUTO_INCREMENT NOT NULL,
    complaint_id CHAR(36) NOT NULL,
    assigned_to CHAR(36) NOT NULL,
    assigned_by CHAR(36) NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (assignment_id),
    UNIQUE KEY uk_assignment_complaint (complaint_id),
    CONSTRAINT fk_assign_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_assign_to FOREIGN KEY (assigned_to) REFERENCES maintenance_staff (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_assign_by FOREIGN KEY (assigned_by) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Ref: ComplaintImage Model (timestamps: false)
CREATE TABLE complaint_images (
    image_id INT AUTO_INCREMENT NOT NULL,
    complaint_id CHAR(36) NOT NULL,
    attachment_type_id INT NOT NULL,
    uploaded_by CHAR(36) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (image_id),
    CONSTRAINT fk_images_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_images_type FOREIGN KEY (attachment_type_id) REFERENCES attachment_types (attachment_type_id) ON DELETE RESTRICT,
    CONSTRAINT fk_images_uploader FOREIGN KEY (uploaded_by) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Ref: StatusHistory Model (timestamps: false)
CREATE TABLE status_history (
    history_id INT AUTO_INCREMENT NOT NULL,
    complaint_id CHAR(36) NOT NULL,
    old_status_id INT NULL,
    new_status_id INT NOT NULL,
    changed_by CHAR(36) NOT NULL,
    remarks VARCHAR(500) NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (history_id),
    CONSTRAINT fk_history_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_history_old_status FOREIGN KEY (old_status_id) REFERENCES complaint_statuses (status_id) ON DELETE SET NULL,
    CONSTRAINT fk_history_new_status FOREIGN KEY (new_status_id) REFERENCES complaint_statuses (status_id) ON DELETE RESTRICT,
    CONSTRAINT fk_history_changer FOREIGN KEY (changed_by) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Ref: WorkLog Model (timestamps: false)
CREATE TABLE work_logs (
    worklog_id INT AUTO_INCREMENT NOT NULL,
    complaint_id CHAR(36) NOT NULL,
    staff_id CHAR(36) NOT NULL,
    work_note TEXT NOT NULL,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (worklog_id),
    CONSTRAINT fk_work_logs_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_work_logs_staff FOREIGN KEY (staff_id) REFERENCES maintenance_staff (user_id) ON DELETE CASCADE
);

-- Ref: Resolution Model (timestamps: false)
CREATE TABLE resolutions (
    resolution_id INT AUTO_INCREMENT NOT NULL,
    complaint_id CHAR(36) NOT NULL,
    resolved_by CHAR(36) NOT NULL,
    resolved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolution_summary TEXT NOT NULL,
    resolution_date DATE NOT NULL,
    PRIMARY KEY (resolution_id),
    UNIQUE KEY uk_resolution_complaint (complaint_id),
    CONSTRAINT fk_resolutions_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_resolutions_staff FOREIGN KEY (resolved_by) REFERENCES maintenance_staff (user_id) ON DELETE CASCADE
);

-- Ref: Comment Model (timestamps: false)
CREATE TABLE comments (
    comment_id INT AUTO_INCREMENT NOT NULL,
    complaint_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    content TEXT NOT NULL,
    comment_type ENUM('user', 'staff', 'admin', 'system') DEFAULT 'user',
    comment_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id),
    CONSTRAINT fk_comments_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Ref: Feedback Model (timestamps: false)
CREATE TABLE feedbacks (
    feedback_id INT AUTO_INCREMENT NOT NULL,
    complaint_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    rating INT NOT NULL,
    feedback_text TEXT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (feedback_id),
    UNIQUE KEY uk_feedback_complaint (complaint_id),
    CONSTRAINT fk_feedbacks_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_feedbacks_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- ============================================================================
-- 4. UTILITIES & SYSTEM MANAGEMENT
-- ============================================================================

-- Ref: NotificationTemplate Model (timestamps: true)
CREATE TABLE notification_templates (
    template_id INT AUTO_INCREMENT NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (template_id),
    UNIQUE KEY uk_template_name (template_name)
);

-- Ref: Notification Model (timestamps: false)
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT NOT NULL,
    user_id CHAR(36) NOT NULL,
    complaint_id CHAR(36) NULL,
    template_id INT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_template FOREIGN KEY (template_id) REFERENCES notification_templates (template_id) ON DELETE SET NULL
);

-- Ref: AuditLog Model (timestamps: false)
CREATE TABLE audit_logs (
    audit_id INT AUTO_INCREMENT NOT NULL,
    user_id CHAR(36) NULL,
    action_type VARCHAR(50) NOT NULL,
    affected_table VARCHAR(50) NULL,
    action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    details JSON NULL,
    PRIMARY KEY (audit_id),
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
);