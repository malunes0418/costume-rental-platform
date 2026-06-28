"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("reservations", "start_date", {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    await queryInterface.changeColumn("reservations", "end_date", {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("reservations", "start_date", {
      type: Sequelize.DATEONLY,
      allowNull: false
    });
    await queryInterface.changeColumn("reservations", "end_date", {
      type: Sequelize.DATEONLY,
      allowNull: false
    });
  }
};
