module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_fulfillment_preferences", {
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      default_saved_location_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "user_saved_locations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      default_delivery_window_slot: {
        type: Sequelize.ENUM("MORNING", "AFTERNOON", "EVENING"),
        allowNull: true
      },
      default_return_window_slot: {
        type: Sequelize.ENUM("MORNING", "AFTERNOON", "EVENING"),
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_fulfillment_preferences");
  }
};
