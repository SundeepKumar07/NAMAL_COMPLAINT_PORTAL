'use strict';

const now = new Date();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('categories', [
      { category_name: 'Electrical', description: 'Electrical issues', created_at: now, updated_at: now },
      { category_name: 'HVAC', description: 'Heating, ventilation, air conditioning', created_at: now, updated_at: now },
      { category_name: 'Plumbing', description: 'Water and plumbing issues', created_at: now, updated_at: now },
      { category_name: 'IT', description: 'Network and IT infrastructure', created_at: now, updated_at: now },
      { category_name: 'Furniture', description: 'Furniture repair and replacement', created_at: now, updated_at: now },
      { category_name: 'Civil', description: 'Structural and civil works', created_at: now, updated_at: now },
      { category_name: 'Other', description: 'Other maintenance issues', created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('complaint_statuses', [
      { status_name: 'Open', description: 'Awaiting assignment', created_at: now, updated_at: now },
      { status_name: 'Assigned', description: 'Assigned to maintenance staff', created_at: now, updated_at: now },
      { status_name: 'In Progress', description: 'Work in progress', created_at: now, updated_at: now },
      { status_name: 'Resolved', description: 'Work completed', created_at: now, updated_at: now },
      { status_name: 'Closed', description: 'Complaint closed', created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('priority_levels', [
      { priority_name: 'Critical', description: 'Immediate attention', response_time_hours: 2, hours_resolution: 24, created_at: now, updated_at: now },
      { priority_name: 'High', description: 'High priority', response_time_hours: 8, hours_resolution: 48, created_at: now, updated_at: now },
      { priority_name: 'Medium', description: 'Normal priority', response_time_hours: 24, hours_resolution: 72, created_at: now, updated_at: now },
      { priority_name: 'Low', description: 'Low priority', response_time_hours: 48, hours_resolution: 168, created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('departments', [
      { department_name: 'Computer Science', faculty_name: 'Faculty of Engineering', created_at: now, updated_at: now },
      { department_name: 'Electrical Engineering', faculty_name: 'Faculty of Engineering', created_at: now, updated_at: now },
      { department_name: 'Administration', faculty_name: 'Administration', created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('buildings', [
      { building_name: 'Academic Block A', campus_area: 'Main Campus', floors: 4, created_at: now, updated_at: now },
      { building_name: 'Academic Block B', campus_area: 'Main Campus', floors: 4, created_at: now, updated_at: now },
      { building_name: 'Hostel - Boys', campus_area: 'Residential', floors: 3, created_at: now, updated_at: now },
      { building_name: 'Hostel - Girls', campus_area: 'Residential', floors: 3, created_at: now, updated_at: now },
      { building_name: 'Library', campus_area: 'Main Campus', floors: 2, created_at: now, updated_at: now },
      { building_name: 'Cafeteria', campus_area: 'Main Campus', floors: 1, created_at: now, updated_at: now },
      { building_name: 'Sports Complex', campus_area: 'Sports', floors: 1, created_at: now, updated_at: now },
      { building_name: 'Administration Block', campus_area: 'Main Campus', floors: 2, created_at: now, updated_at: now },
    ]);

    const buildings = await queryInterface.sequelize.query(
      'SELECT building_id, building_name FROM buildings',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const buildingMap = Object.fromEntries(buildings.map((b) => [b.building_name, b.building_id]));

    await queryInterface.bulkInsert('locations', [
      { building_id: buildingMap['Academic Block A'], room_no: '201', floor_no: 2, created_at: now, updated_at: now },
      { building_id: buildingMap['Academic Block B'], room_no: 'Lab-2', floor_no: 1, created_at: now, updated_at: now },
      { building_id: buildingMap['Hostel - Boys'], room_no: 'B-104', floor_no: 1, created_at: now, updated_at: now },
      { building_id: buildingMap['Hostel - Girls'], room_no: 'G-203', floor_no: 2, created_at: now, updated_at: now },
      { building_id: buildingMap['Library'], room_no: 'Study Hall 3', floor_no: 1, created_at: now, updated_at: now },
      { building_id: buildingMap['Cafeteria'], room_no: 'Main Hall', floor_no: 0, created_at: now, updated_at: now },
      { building_id: buildingMap['Sports Complex'], room_no: 'Gym', floor_no: 0, created_at: now, updated_at: now },
      { building_id: buildingMap['Administration Block'], room_no: 'Admissions Office', floor_no: 1, created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('attachment_types', [
      { type_name: 'complaint_photo', description: 'Photo submitted with complaint', created_at: now, updated_at: now },
      { type_name: 'resolution_photo', description: 'Photo after resolution', created_at: now, updated_at: now },
      { type_name: 'supporting_doc', description: 'Supporting document', created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('locations', null, {});
    await queryInterface.bulkDelete('buildings', null, {});
    await queryInterface.bulkDelete('departments', null, {});
    await queryInterface.bulkDelete('attachment_types', null, {});
    await queryInterface.bulkDelete('priority_levels', null, {});
    await queryInterface.bulkDelete('complaint_statuses', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  },
};
