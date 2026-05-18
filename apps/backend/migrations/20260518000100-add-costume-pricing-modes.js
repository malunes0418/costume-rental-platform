module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("costumes", "base_price_per_day", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    await queryInterface.addColumn("costumes", "pricing_mode", {
      type: Sequelize.ENUM("PER_DAY", "PACKAGE"),
      allowNull: false,
      defaultValue: "PER_DAY"
    });
    await queryInterface.addColumn("costumes", "package_price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn("costumes", "package_included_days", {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn("costumes", "package_unused_day_discount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn("costumes", "package_extra_day_charge", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    await queryInterface.addColumn("reservation_items", "pricing_mode", {
      type: Sequelize.ENUM("PER_DAY", "PACKAGE"),
      allowNull: false,
      defaultValue: "PER_DAY"
    });
    await queryInterface.addColumn("reservation_items", "package_base_price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn("reservation_items", "package_included_days", {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn("reservation_items", "package_unused_day_discount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn("reservation_items", "package_extra_day_charge", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("reservation_items", "package_extra_day_charge");
    await queryInterface.removeColumn("reservation_items", "package_unused_day_discount");
    await queryInterface.removeColumn("reservation_items", "package_included_days");
    await queryInterface.removeColumn("reservation_items", "package_base_price");
    await queryInterface.removeColumn("reservation_items", "pricing_mode");

    await queryInterface.removeColumn("costumes", "package_extra_day_charge");
    await queryInterface.removeColumn("costumes", "package_unused_day_discount");
    await queryInterface.removeColumn("costumes", "package_included_days");
    await queryInterface.removeColumn("costumes", "package_price");
    await queryInterface.removeColumn("costumes", "pricing_mode");

    await queryInterface.changeColumn("costumes", "base_price_per_day", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
  }
};
