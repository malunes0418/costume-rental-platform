"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("user_saved_locations");
    if (!tableDesc.latitude) {
      await queryInterface.addColumn("user_saved_locations", "latitude", {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
        defaultValue: null,
        after: "notes"
      });
    }
    if (!tableDesc.longitude) {
      await queryInterface.addColumn("user_saved_locations", "longitude", {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
        defaultValue: null,
        after: "latitude"
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("user_saved_locations", "latitude");
    await queryInterface.removeColumn("user_saved_locations", "longitude");
  }
};
