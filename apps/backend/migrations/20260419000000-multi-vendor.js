module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add vendor_status to users
    await queryInterface.addColumn("users", "vendor_status", {
      type: Sequelize.ENUM("NONE", "PENDING", "APPROVED", "REJECTED"),
      allowNull: false,
      defaultValue: "NONE"
    });

    // 2. Create vendor_profiles table
    await queryInterface.createTable("vendor_profiles", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      business_name: { type: Sequelize.STRING(255), allowNull: true },
      bio: { type: Sequelize.TEXT, allowNull: true },
      id_document_url: { type: Sequelize.STRING(500), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") }
    });
    
    await queryInterface.addConstraint("vendor_profiles", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_vendor_profiles_user_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
    
    await queryInterface.addConstraint("vendor_profiles", {
      fields: ["user_id"],
      type: "unique",
      name: "uq_vendor_profiles_user_id"
    });

    // 3. Add owner_id and status to costumes
    await queryInterface.addColumn("costumes", "owner_id", {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true // Allow null initially for existing rows
    });

    await queryInterface.addConstraint("costumes", {
      fields: ["owner_id"],
      type: "foreign key",
      name: "fk_costumes_owner_id",
      references: { table: "users", field: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE"
    });

    await queryInterface.addColumn("costumes", "status", {
      type: Sequelize.ENUM("ACTIVE", "HIDDEN", "FLAGGED"),
      allowNull: false,
      defaultValue: "ACTIVE"
    });

    // 4. Add vendor_status to reservations
    await queryInterface.addColumn("reservations", "vendor_status", {
      type: Sequelize.ENUM("PENDING_VENDOR", "CONFIRMED", "REJECTED_BY_VENDOR"),
      allowNull: false,
      defaultValue: "CONFIRMED" // Default confirmed for existing reservations
    });

    // 5. Create messages table
    await queryInterface.createTable("messages", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      reservation_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      sender_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });

    await queryInterface.addConstraint("messages", {
      fields: ["reservation_id"],
      type: "foreign key",
      name: "fk_messages_reservation_id",
      references: { table: "reservations", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });

    await queryInterface.addConstraint("messages", {
      fields: ["sender_id"],
      type: "foreign key",
      name: "fk_messages_sender_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("messages");
    await queryInterface.removeColumn("reservations", "vendor_status");
    await queryInterface.removeConstraint("costumes", "fk_costumes_owner_id");
    await queryInterface.removeColumn("costumes", "status");
    await queryInterface.removeColumn("costumes", "owner_id");
    await queryInterface.dropTable("vendor_profiles");
    await queryInterface.removeColumn("users", "vendor_status");
  }
};
