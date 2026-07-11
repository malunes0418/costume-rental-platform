"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("content_reports", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      reporter_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      target_type: {
        type: Sequelize.ENUM("COSTUME", "USER", "REVIEW", "OTHER"),
        allowNull: false
      },
      target_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM("OPEN", "RESOLVED", "DISMISSED"),
        allowNull: false,
        defaultValue: "OPEN"
      },
      resolution_note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      resolved_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      resolved_at: {
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

    await queryInterface.addIndex("content_reports", ["status"], {
      name: "content_reports_status_idx"
    });
    await queryInterface.addIndex("content_reports", ["target_type", "target_id"], {
      name: "content_reports_target_idx"
    });
    await queryInterface.addIndex("content_reports", ["created_at"], {
      name: "content_reports_created_at_idx"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("content_reports");
  }
};
