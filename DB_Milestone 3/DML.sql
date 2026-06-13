USE namal_complaints;

-- Explicitly purge tables in safe alignment sequence before loading massive datasets
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE notification_templates;
TRUNCATE TABLE feedbacks;
TRUNCATE TABLE comments;
TRUNCATE TABLE resolutions;
TRUNCATE TABLE work_logs;
TRUNCATE TABLE status_history;
TRUNCATE TABLE complaint_images;
TRUNCATE TABLE complaint_assignments;
TRUNCATE TABLE complaints;
TRUNCATE TABLE attachment_types;
TRUNCATE TABLE priority_levels;
TRUNCATE TABLE complaint_statuses;
TRUNCATE TABLE locations;
TRUNCATE TABLE buildings;
TRUNCATE TABLE staff_specializations;
TRUNCATE TABLE categories;
TRUNCATE TABLE maintenance_staff;
TRUNCATE TABLE admins;
TRUNCATE TABLE end_users;
TRUNCATE TABLE departments;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 1. SEED META DATA DEFINITIONS
-- ==========================================

INSERT INTO departments (department_id, department_name, faculty_name) VALUES [cite: 32]
(1, 'Computer Science', 'Faculty of Computing'),
(2, 'Electrical Engineering', 'Faculty of Engineering'),
(3, 'Business Administration', 'Faculty of Social Sciences'),
(4, 'Mathematics', 'Faculty of Sciences');

INSERT INTO categories (category_id, category_name, description) VALUES [cite: 13]
(1, 'Electrical', 'Power sockets, lighting fixtures, distribution boxes'),
(2, 'Plumbing', 'Water blockages, piping issues, bathroom leaks'),
(3, 'HVAC', 'AC units, split ventilation systems'),
(4, 'Carpentry', 'Broken furniture, loose doors, window frames'),
(5, 'IT Infrastructure', 'Ethernet structural ports, projector mountings');

INSERT INTO buildings (building_id, building_name, campus_area, floors) VALUES [cite: 10]
(1, 'Academic Block A', 'Main Core Campus', 3),
(2, 'Academic Block B', 'Main Core Campus', 2),
(3, 'Iqbal Hostel', 'Residential Sector', 4),
(4, 'Fatima Jinnah Hostel', 'Residential Sector', 3);

INSERT INTO locations (location_id, building_id, room_no, floor_no) VALUES [cite: 64]
(1, 1, 'Lab 202', 2),
(2, 1, 'Lecture Theater 1', 1),
(3, 2, 'Room 105', 1),
(4, 3, 'Room 214', 2),
(5, 4, 'Common Hall Room 1', 1);

INSERT INTO complaint_statuses (status_id, status_name, description) VALUES [cite: 29]
(1, 'Open', 'Logged'),
(2, 'Assigned', 'Dispatched to specialized workforce'),
(3, 'In Progress', 'Active repairs'),
(4, 'Resolved', 'Issues solved successfully'),
(5, 'Closed', 'Archived historical items');

INSERT INTO priority_levels (priority_id, priority_name, description, response_time_hours, hours_resolution) VALUES [cite: 76]
(1, 'Critical', 'Safety issues or massive class disruption', 1, 6),
(2, 'High', 'Severe inconvenience', 4, 24),
(3, 'Medium', 'Standard operational requests', 12, 48),
(4, 'Low', 'Cosmetic tasks', 24, 120);

INSERT INTO attachment_types (attachment_type_id, type_name, description) VALUES [cite: 4]
(1, 'Pre-Repair Image', 'Damage evidence'),
(2, 'Post-Repair Image', 'Work validation documentation');

INSERT INTO notification_templates (template_id, template_name, template_text) VALUES [cite: 73]
(1, 'Ticket State Shift', 'Status of ticket {id} changed to {status}.');

-- ==========================================
-- 2. SEED USERS, STAFF, & PROFILES 
-- ==========================================

-- Variables to keep references accurate
SET @adm_1 = '00000000-0000-0000-0000-000000000001';
SET @adm_2 = '00000000-0000-0000-0000-000000000002';

SET @stu_1 = '11111111-1111-1111-1111-111111111111';
SET @stu_2 = '11111111-1111-1111-1111-222222222222';
SET @stu_3 = '11111111-1111-1111-1111-333333333333';
SET @fac_1 = '22222222-2222-2222-2222-111111111111';
SET @fac_2 = '22222222-2222-2222-2222-222222222222';

SET @tech_1 = '33333333-3333-3333-3333-111111111111';
SET @tech_2 = '33333333-3333-3333-3333-222222222222';
SET @tech_3 = '33333333-3333-3333-3333-333333333333';

-- Base Users
INSERT INTO users (user_id, full_name, email, password, phone_no, role_type) VALUES [cite: 88]
(@adm_1, 'Sajid Mehmood', 'sajid.mehmood@namal.edu.pk', 'p1', '03001', 'admin'),
(@adm_2, 'Aisha Bibi', 'aisha.bibi@namal.edu.pk', 'p2', '03002', 'admin'),
(@stu_1, 'Ahmed Ali', 'ahmed.ali@namal.edu.pk', 's1', '03111', 'end_user'),
(@stu_2, 'Fatima Shah', 'fatima.shah@namal.edu.pk', 's2', '03112', 'end_user'),
(@stu_3, 'Bilal Mansoor', 'bilal.mansoor@namal.edu.pk', 's3', '03113', 'end_user'),
(@fac_1, 'Dr. Arshad Nasir', 'arshad.nasir@namal.edu.pk', 'f1', '03221', 'end_user'),
(@fac_2, 'Dr. Maryam Niaz', 'maryam.niaz@namal.edu.pk', 'f2', '03222', 'end_user'),
(@tech_1, 'Tariq Javed', 'tariq.javed@namal.edu.pk', 't1', '03331', 'maintenance_staff'),
(@tech_2, 'Kamran Khan', 'kamran.khan@namal.edu.pk', 't2', '03332', 'maintenance_staff'),
(@tech_3, 'Muhammad Rizwan', 'm.rizwan@namal.edu.pk', 't3', '03333', 'maintenance_staff');

-- Roles Linkings
INSERT INTO admins (user_id, access_level, designation) VALUES [cite: 2]
(@adm_1, 'superadmin', 'Director of Infrastructure'),
(@adm_2, 'system_admin', 'Helpdesk Operative');

INSERT INTO end_users (user_id, department_id, user_type, university_id) VALUES [cite: 34]
(@stu_1, 1, 'student', 'NUM-BSCS-2023-01'),
(@stu_2, 1, 'student', 'NUM-BSCS-2024-42'),
(@stu_3, 2, 'student', 'NUM-BSCS-2025-19'),
(@fac_1, 1, 'faculty', 'FAC-CS-01'),
(@fac_2, 3, 'faculty', 'FAC-BA-02');

INSERT INTO maintenance_staff (user_id, staff_code, availability_status, workload_count) VALUES [cite: 67]
(@tech_1, 'STF-ELEC-88', 'busy', 2),
(@tech_2, 'STF-PLUM-21', 'available', 0),
(@tech_3, 'STF-HVAC-04', 'busy', 1);

INSERT INTO staff_specializations (staff_id, category_id, proficiency_level) VALUES [cite: 82]
(@tech_1, 1, 'expert'),
(@tech_2, 2, 'expert'),
(@tech_3, 3, 'intermediate');

-- ==========================================
-- 3. PLENTY OF TRANSACTIONAL ENTRIES
-- ==========================================

-- System Complaint IDs
SET @c1 = 'aaaaaaaa-1111-1111-1111-111111111111';
SET @c2 = 'aaaaaaaa-2222-2222-2222-222222222222';
SET @c3 = 'aaaaaaaa-3333-3333-3333-333333333333';
SET @c4 = 'aaaaaaaa-4444-4444-4444-444444444444';
SET @c5 = 'aaaaaaaa-5555-5555-5555-555555555555';

INSERT INTO complaints (complaint_id, ticket_id, title, description, submitted_by, category_id, status_id, priority_id, location_id) VALUES [cite: 19]
(@c1, 'TKT-101', 'Short Circuit / UPS Outlets Dead', 'Desktop computer layout row power failure.', @stu_1, 1, 4, 1, 1),
(@c2, 'TKT-102', 'AC Leaking Water Indoors', 'Split unit dripping fluid on instructional podium.', @fac_1, 3, 3, 2, 2),
(@c3, 'TKT-103', 'Flush tank leaking non-stop', 'Continuous running water filling drainage pipelines down.', @stu_3, 2, 2, 3, 4),
(@c4, 'TKT-104', 'Broken door hinge Room 214', 'Woodframe structural cracking sounds near bottom joint.', @stu_2, 4, 1, 4, 4),
(@c5, 'TKT-105', 'Projector Wall Interface loose', 'VGA connection header missing secure frame screws.', @fac_2, 5, 5, 3, 3);

-- Operations & Inter-relations
INSERT INTO complaint_assignments (complaint_id, assigned_to, assigned_by) VALUES [cite: 23]
(@c1, @tech_1, @adm_2),
(@c2, @tech_3, @adm_1),
(@c3, @tech_2, @adm_2);

INSERT INTO status_history (complaint_id, old_status_id, new_status_id, changed_by, remarks) VALUES [cite: 85]
(@c1, NULL, 1, @stu_1, 'Created via portal link.'),
(@c1, 1, 2, @adm_2, 'Dispatched specialized tech.'),
(@c1, 2, 4, @tech_1, 'Completed replacement tasks cleanly.');

INSERT INTO work_logs (complaint_id, staff_id, work_note) VALUES [cite: 92]
(@c1, @tech_1, 'Faulty 16A circuit breaker module isolated and replaced completely.'),
(@c2, @tech_3, 'Unblocking structural drainage tubes of outer condensation trays.');

INSERT INTO resolutions (complaint_id, resolved_by, resolution_summary, resolution_date) VALUES [cite: 79]
(@c1, @tech_1, 'Re-wired short circuit paths. Restored full safe power metrics back to rows.', CURDATE());

INSERT INTO comments (complaint_id, user_id, content, comment_type) VALUES [cite: 16]
(@c2, @adm_1, 'Dispatched emergency response units to clear presentation zones.', 'admin'),
(@c2, @fac_1, 'Understood, sitting by room to let tracking units enter.', 'user');

INSERT INTO feedbacks (complaint_id, user_id, rating, feedback_text) VALUES [cite: 37]
(@c1, @stu_1, 5, 'Super fast response! Thank you helpdesk.');

INSERT INTO notifications (user_id, complaint_id, template_id, message) VALUES [cite: 70]
(@stu_1, @c1, 1, 'Status of ticket TKT-101 changed to Resolved.');

INSERT INTO audit_logs (user_id, action_type, affected_table, details) VALUES [cite: 7]
(@adm_2, 'DISPATCH', 'complaint_assignments', '{"target_ticket": "TKT-101"}');