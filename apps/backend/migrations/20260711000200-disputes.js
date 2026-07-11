"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("disputes", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      reservation_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "reservations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      opened_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      against_user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM("OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"),
        allowNull: false,
        defaultValue: "OPEN"
      },
      resolution_note: {
        type: Sequelize.TEXT,
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

    await queryInterface.createTable("dispute_messages", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      dispute_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "disputes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      author_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addIndex("disputes", ["status"], { name: "disputes_status_idx" });
    await queryInterface.addIndex("disputes", ["reservation_id"], {
      name: "disputes_reservation_id_idx"
    });
    await queryInterface.addIndex("disputes", ["created_at"], { name: "disputes_created_at_idx" });
    await queryInterface.addIndex("dispute_messages", ["dispute_id"], {
      name: "dispute_messages_dispute_id_idx"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("dispute_messages");
    await queryInterface.dropTable("disputes");
  }
};
