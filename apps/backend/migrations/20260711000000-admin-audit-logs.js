"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("admin_audit_logs", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      actor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(60),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false
      },
      before_json: {
        type: Sequelize.JSON,
        allowNull: true
      },
      after_json: {
        type: Sequelize.JSON,
        allowNull: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex("admin_audit_logs", ["actor_id"], {
      name: "admin_audit_logs_actor_id_idx"
    });
    await queryInterface.addIndex("admin_audit_logs", ["entity_type", "entity_id"], {
      name: "admin_audit_logs_entity_idx"
    });
    await queryInterface.addIndex("admin_audit_logs", ["action"], {
      name: "admin_audit_logs_action_idx"
    });
    await queryInterface.addIndex("admin_audit_logs", ["created_at"], {
      name: "admin_audit_logs_created_at_idx"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("admin_audit_logs");
  }
};
