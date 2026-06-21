const OLD_RESERVATION_STATUS_VALUES = [
  "CART",
  "PENDING_PAYMENT",
  "PENDING_VENDOR_REVIEW",
  "AWAITING_SURCHARGE_PAYMENT",
  "CONFIRMED",
  "OUTBOUND_SCHEDULED",
  "OUTBOUND_IN_PROGRESS",
  "WITH_RENTER",
  "RETURN_SCHEDULED",
  "RETURN_IN_PROGRESS",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED_BY_VENDOR"
];

const NEW_RESERVATION_STATUS_VALUES = [
  "CART",
  "PENDING_PAYMENT",
  "PENDING_VENDOR_REVIEW",
  "AWAITING_SURCHARGE_PAYMENT",
  "CONFIRMED",
  "DELIVERY_SCHEDULED",
  "WITH_RENTER",
  "RETURN_PENDING",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED_BY_VENDOR"
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("reservations", "status", {
      type: Sequelize.ENUM(...new Set([...OLD_RESERVATION_STATUS_VALUES, ...NEW_RESERVATION_STATUS_VALUES])),
      allowNull: false,
      defaultValue: "CART"
    });

    await queryInterface.sequelize.query(`
      UPDATE reservations
      SET status = CASE
        WHEN status = 'OUTBOUND_SCHEDULED' THEN 'DELIVERY_SCHEDULED'
        WHEN status = 'OUTBOUND_IN_PROGRESS' THEN 'WITH_RENTER'
        WHEN status = 'RETURN_SCHEDULED' THEN 'WITH_RENTER'
        WHEN status = 'RETURN_IN_PROGRESS' THEN 'RETURN_PENDING'
        ELSE status
      END
    `);

    await queryInterface.changeColumn("reservations", "status", {
      type: Sequelize.ENUM(...NEW_RESERVATION_STATUS_VALUES),
      allowNull: false,
      defaultValue: "CART"
    });

    await queryInterface.addColumn("reservation_fulfillment", "outbound_dispatched_at", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("reservation_fulfillment", "outbound_dispatch_proof_url", {
      type: Sequelize.STRING(512),
      allowNull: true
    });
    await queryInterface.addColumn("reservation_fulfillment", "renter_received_at", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("reservation_fulfillment", "renter_received_proof_url", {
      type: Sequelize.STRING(512),
      allowNull: true
    });
    await queryInterface.addColumn("reservation_fulfillment", "return_initiated_at", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("reservation_fulfillment", "return_initiated_proof_url", {
      type: Sequelize.STRING(512),
      allowNull: true
    });
    await queryInterface.addColumn("reservation_fulfillment", "vendor_return_received_at", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("reservation_fulfillment", "vendor_return_proof_url", {
      type: Sequelize.STRING(512),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("reservation_fulfillment", "vendor_return_proof_url");
    await queryInterface.removeColumn("reservation_fulfillment", "vendor_return_received_at");
    await queryInterface.removeColumn("reservation_fulfillment", "return_initiated_proof_url");
    await queryInterface.removeColumn("reservation_fulfillment", "return_initiated_at");
    await queryInterface.removeColumn("reservation_fulfillment", "renter_received_proof_url");
    await queryInterface.removeColumn("reservation_fulfillment", "renter_received_at");
    await queryInterface.removeColumn("reservation_fulfillment", "outbound_dispatch_proof_url");
    await queryInterface.removeColumn("reservation_fulfillment", "outbound_dispatched_at");

    await queryInterface.changeColumn("reservations", "status", {
      type: Sequelize.ENUM(...new Set([...OLD_RESERVATION_STATUS_VALUES, ...NEW_RESERVATION_STATUS_VALUES])),
      allowNull: false,
      defaultValue: "CART"
    });

    await queryInterface.sequelize.query(`
      UPDATE reservations
      SET status = CASE
        WHEN status = 'DELIVERY_SCHEDULED' THEN 'OUTBOUND_SCHEDULED'
        WHEN status = 'RETURN_PENDING' THEN 'RETURN_IN_PROGRESS'
        ELSE status
      END
    `);

    await queryInterface.changeColumn("reservations", "status", {
      type: Sequelize.ENUM(...OLD_RESERVATION_STATUS_VALUES),
      allowNull: false,
      defaultValue: "CART"
    });
  }
};
