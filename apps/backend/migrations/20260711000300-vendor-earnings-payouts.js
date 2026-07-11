"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("vendor_payouts", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      vendor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "PHP"
      },
      status: {
        type: Sequelize.ENUM("PENDING", "PAID", "FAILED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING"
      },
      payment_method_snapshot: {
        type: Sequelize.JSON,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.createTable("vendor_earning_entries", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      vendor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      reservation_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "reservations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      gross_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      fee_rate: {
        type: Sequelize.DECIMAL(6, 4),
        allowNull: false
      },
      fee_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      net_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM("PENDING", "AVAILABLE", "HELD", "INCLUDED_IN_PAYOUT", "PAID", "VOID"),
        allowNull: false,
        defaultValue: "AVAILABLE"
      },
      payout_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "vendor_payouts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addIndex("vendor_payouts", ["vendor_id"], {
      name: "vendor_payouts_vendor_id_idx"
    });
    await queryInterface.addIndex("vendor_payouts", ["status"], {
      name: "vendor_payouts_status_idx"
    });
    await queryInterface.addIndex("vendor_earning_entries", ["vendor_id", "status"], {
      name: "vendor_earning_entries_vendor_status_idx"
    });
    await queryInterface.addIndex("vendor_earning_entries", ["reservation_id"], {
      name: "vendor_earning_entries_reservation_id_idx",
      unique: true
    });
    await queryInterface.addIndex("vendor_earning_entries", ["payout_id"], {
      name: "vendor_earning_entries_payout_id_idx"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("vendor_earning_entries");
    await queryInterface.dropTable("vendor_payouts");
  }
};
