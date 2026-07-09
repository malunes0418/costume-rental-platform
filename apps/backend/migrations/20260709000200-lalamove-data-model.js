"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. delivery_orders
    await queryInterface.createTable("delivery_orders", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      reservation_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false
      },
      leg: {
        type: Sequelize.ENUM("OUTBOUND", "RETURN"),
        allowNull: false
      },
      lalamove_order_id: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      quotation_id: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      service_type: {
        type: Sequelize.STRING(60),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(60),
        allowNull: true
      },
      price_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      price_currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "PHP"
      },
      driver_name: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      driver_phone: {
        type: Sequelize.STRING(60),
        allowNull: true
      },
      share_link: {
        type: Sequelize.STRING(512),
        allowNull: true
      },
      raw_webhook_payload: {
        type: Sequelize.JSON,
        allowNull: true
      },
      checkout_fee_estimate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex("delivery_orders", ["reservation_id"], {
      name: "delivery_orders_reservation_id_idx"
    });

    // 2. vendor_fulfillment_settings — add delivery_provider + lalamove_service_type
    await queryInterface.addColumn("vendor_fulfillment_settings", "delivery_provider", {
      type: Sequelize.ENUM("MANUAL", "LALAMOVE"),
      allowNull: false,
      defaultValue: "MANUAL",
      after: "service_areas"
    });
    await queryInterface.addColumn("vendor_fulfillment_settings", "lalamove_service_type", {
      type: Sequelize.STRING(60),
      allowNull: true,
      defaultValue: "MOTORCYCLE",
      after: "delivery_provider"
    });

    // 3. reservation_fulfillment — add return_fee_is_estimate
    await queryInterface.addColumn("reservation_fulfillment", "return_fee_is_estimate", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: "return_fee"
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("reservation_fulfillment", "return_fee_is_estimate");
    await queryInterface.removeColumn("vendor_fulfillment_settings", "lalamove_service_type");
    await queryInterface.removeColumn("vendor_fulfillment_settings", "delivery_provider");
    await queryInterface.dropTable("delivery_orders");
  }
};
