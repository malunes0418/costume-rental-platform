module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("vendor_profiles", "review_note", {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("vendor_profiles", "reviewed_at", {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.changeColumn("costumes", "status", {
      type: Sequelize.ENUM("DRAFT", "ACTIVE", "HIDDEN", "FLAGGED"),
      allowNull: false,
      defaultValue: "ACTIVE"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("costumes", "status", {
      type: Sequelize.ENUM("ACTIVE", "HIDDEN", "FLAGGED"),
      allowNull: false,
      defaultValue: "ACTIVE"
    });

    await queryInterface.removeColumn("vendor_profiles", "reviewed_at");
    await queryInterface.removeColumn("vendor_profiles", "review_note");
  }
};
