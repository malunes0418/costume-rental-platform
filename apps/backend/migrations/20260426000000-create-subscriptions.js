module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("subscriptions", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      plan_name: { type: Sequelize.STRING(255), allowNull: false },
      status: { type: Sequelize.ENUM("ACTIVE", "PAST_DUE", "CANCELED", "TRIALING"), allowNull: false, defaultValue: "TRIALING" },
      start_date: { type: Sequelize.DATE, allowNull: false },
      end_date: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") }
    });

    await queryInterface.addConstraint("subscriptions", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_subscriptions_user_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("subscriptions");
  }
};
