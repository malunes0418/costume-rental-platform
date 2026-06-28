module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("vendor_payment_methods", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      method_type: {
        type: Sequelize.ENUM("GCASH", "MAYA", "BANK", "OTHER"),
        allowNull: false
      },
      label: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      account_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      account_number: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      bank_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      qr_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sort_order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    await queryInterface.addIndex("vendor_payment_methods", ["user_id"]);
    await queryInterface.addIndex("vendor_payment_methods", ["user_id", "is_active"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("vendor_payment_methods");
  }
};
