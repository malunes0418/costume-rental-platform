module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("payments", "reservation_ids", {
      type: Sequelize.JSON,
      allowNull: true
    });
    
    // Migrate data from reservation_id to reservation_ids
    await queryInterface.sequelize.query(`
      UPDATE payments SET reservation_ids = JSON_ARRAY(reservation_id)
    `);

    await queryInterface.changeColumn("payments", "reservation_ids", {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.removeColumn("payments", "reservation_id");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("payments", "reservation_id", {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true
    });
    
    await queryInterface.sequelize.query(`
      UPDATE payments SET reservation_id = JSON_EXTRACT(reservation_ids, '$[0]')
    `);
    
    await queryInterface.changeColumn("payments", "reservation_id", {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false
    });

    await queryInterface.removeColumn("payments", "reservation_ids");
  }
};
