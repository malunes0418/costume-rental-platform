module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_notification_preferences", {
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      reservations_email: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      reservations_push: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      payments_email: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      payments_push: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      messages_email: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      messages_push: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      marketing_email: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      marketing_push: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_notification_preferences");
  }
};
