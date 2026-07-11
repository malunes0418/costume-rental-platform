"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Prevent duplicate active delivery bookings per reservation leg.
    // Existing canceled/failed rows may still share the pair; app logic excludes those statuses.
    await queryInterface.addIndex("delivery_orders", ["reservation_id", "leg"], {
      name: "delivery_orders_reservation_leg_idx"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("delivery_orders", "delivery_orders_reservation_leg_idx");
  }
};
