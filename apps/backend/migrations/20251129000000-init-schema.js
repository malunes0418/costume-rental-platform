module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: true },
      name: { type: Sequelize.STRING(255), allowNull: true },
      avatar_url: { type: Sequelize.STRING(500), allowNull: true },
      role: { type: Sequelize.ENUM("USER", "ADMIN"), allowNull: false, defaultValue: "USER" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") }
    });

    await queryInterface.createTable("oauth_accounts", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      provider: { type: Sequelize.STRING(50), allowNull: false },
      provider_user_id: { type: Sequelize.STRING(255), allowNull: false },
      access_token: { type: Sequelize.STRING(500), allowNull: true },
      refresh_token: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });
    await queryInterface.addConstraint("oauth_accounts", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_oauth_accounts_user_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
    await queryInterface.addConstraint("oauth_accounts", {
      fields: ["provider", "provider_user_id"],
      type: "unique",
      name: "uq_provider_user"
    });

    await queryInterface.createTable("costumes", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING(100), allowNull: true },
      size: { type: Sequelize.STRING(50), allowNull: true },
      gender: { type: Sequelize.STRING(50), allowNull: true },
      theme: { type: Sequelize.STRING(100), allowNull: true },
      base_price_per_day: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      deposit_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") }
    });

    await queryInterface.createTable("costume_images", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      costume_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      image_url: { type: Sequelize.STRING(500), allowNull: false },
      is_primary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }
    });
    await queryInterface.addConstraint("costume_images", {
      fields: ["costume_id"],
      type: "foreign key",
      name: "fk_costume_images_costume_id",
      references: { table: "costumes", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });

    await queryInterface.createTable("inventory", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      costume_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      quantity_available: { type: Sequelize.INTEGER, allowNull: false }
    });
    await queryInterface.addConstraint("inventory", {
      fields: ["costume_id"],
      type: "foreign key",
      name: "fk_inventory_costume_id",
      references: { table: "costumes", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
    await queryInterface.addConstraint("inventory", {
      fields: ["costume_id", "date"],
      type: "unique",
      name: "uq_costume_date"
    });

    await queryInterface.createTable("reservations", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      status: { type: Sequelize.ENUM("CART", "PENDING_PAYMENT", "PAID", "CANCELLED"), allowNull: false, defaultValue: "CART" },
      total_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "PHP" },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") }
    });
    await queryInterface.addConstraint("reservations", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_reservations_user_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });

    await queryInterface.createTable("reservation_items", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      reservation_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      costume_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      price_per_day: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false }
    });
    await queryInterface.addConstraint("reservation_items", {
      fields: ["reservation_id"],
      type: "foreign key",
      name: "fk_reservation_items_reservation_id",
      references: { table: "reservations", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
    await queryInterface.addConstraint("reservation_items", {
      fields: ["costume_id"],
      type: "foreign key",
      name: "fk_reservation_items_costume_id",
      references: { table: "costumes", field: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE"
    });

    await queryInterface.createTable("payments", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      reservation_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status: { type: Sequelize.ENUM("PENDING", "APPROVED", "REJECTED"), allowNull: false, defaultValue: "PENDING" },
      proof_url: { type: Sequelize.STRING(500), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") }
    });
    await queryInterface.addConstraint("payments", {
      fields: ["reservation_id"],
      type: "foreign key",
      name: "fk_payments_reservation_id",
      references: { table: "reservations", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
    await queryInterface.addConstraint("payments", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_payments_user_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });

    await queryInterface.createTable("notifications", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      type: { type: Sequelize.STRING(100), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });
    await queryInterface.addConstraint("notifications", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_notifications_user_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });

    await queryInterface.createTable("wishlist_items", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      costume_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });
    await queryInterface.addConstraint("wishlist_items", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_wishlist_items_user_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
    await queryInterface.addConstraint("wishlist_items", {
      fields: ["costume_id"],
      type: "foreign key",
      name: "fk_wishlist_items_costume_id",
      references: { table: "costumes", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
    await queryInterface.addConstraint("wishlist_items", {
      fields: ["user_id", "costume_id"],
      type: "unique",
      name: "uq_user_costume_wishlist"
    });

    await queryInterface.createTable("reviews", {
      id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      costume_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") }
    });
    await queryInterface.addConstraint("reviews", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_reviews_user_id",
      references: { table: "users", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
    await queryInterface.addConstraint("reviews", {
      fields: ["costume_id"],
      type: "foreign key",
      name: "fk_reviews_costume_id",
      references: { table: "costumes", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("reviews");
    await queryInterface.dropTable("wishlist_items");
    await queryInterface.dropTable("notifications");
    await queryInterface.dropTable("payments");
    await queryInterface.dropTable("reservation_items");
    await queryInterface.dropTable("reservations");
    await queryInterface.dropTable("inventory");
    await queryInterface.dropTable("costume_images");
    await queryInterface.dropTable("costumes");
    await queryInterface.dropTable("oauth_accounts");
    await queryInterface.dropTable("users");
  }
};
