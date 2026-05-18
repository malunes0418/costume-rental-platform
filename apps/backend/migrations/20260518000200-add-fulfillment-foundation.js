const OLD_RESERVATION_STATUS_VALUES = ["CART", "PENDING_PAYMENT", "PAID", "CANCELLED"];
const NEW_RESERVATION_STATUS_VALUES = [
  "CART",
  "PENDING_PAYMENT",
  "PENDING_VENDOR_REVIEW",
  "AWAITING_SURCHARGE_PAYMENT",
  "CONFIRMED",
  "OUTBOUND_SCHEDULED",
  "OUTBOUND_IN_PROGRESS",
  "WITH_RENTER",
  "RETURN_SCHEDULED",
  "RETURN_IN_PROGRESS",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED_BY_VENDOR"
];
const OLD_VENDOR_STATUS_VALUES = ["PENDING_VENDOR", "CONFIRMED", "REJECTED_BY_VENDOR"];
const NEW_VENDOR_STATUS_VALUES = [
  "NOT_REQUIRED",
  "PENDING_VENDOR_REVIEW",
  "APPROVED_BY_VENDOR",
  "REJECTED_BY_VENDOR"
];

function enumValues(values) {
  return values.map((value) => `'${value}'`).join(", ");
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("reservations", "status", {
      type: Sequelize.ENUM(...new Set([...OLD_RESERVATION_STATUS_VALUES, ...NEW_RESERVATION_STATUS_VALUES])),
      allowNull: false,
      defaultValue: "CART"
    });

    await queryInterface.changeColumn("reservations", "vendor_status", {
      type: Sequelize.ENUM(...new Set([...OLD_VENDOR_STATUS_VALUES, ...NEW_VENDOR_STATUS_VALUES])),
      allowNull: false,
      defaultValue: "NOT_REQUIRED"
    });

    await queryInterface.sequelize.query(`
      UPDATE reservations
      SET status = CASE
        WHEN status = 'PAID' AND vendor_status = 'PENDING_VENDOR' THEN 'PENDING_VENDOR_REVIEW'
        WHEN status = 'PAID' AND vendor_status = 'REJECTED_BY_VENDOR' THEN 'REJECTED_BY_VENDOR'
        WHEN status = 'PAID' THEN 'CONFIRMED'
        ELSE status
      END
    `);

    await queryInterface.sequelize.query(`
      UPDATE reservations
      SET vendor_status = CASE
        WHEN status = 'PENDING_VENDOR_REVIEW' THEN 'PENDING_VENDOR_REVIEW'
        WHEN status = 'REJECTED_BY_VENDOR' THEN 'REJECTED_BY_VENDOR'
        WHEN status IN ('CONFIRMED', 'OUTBOUND_SCHEDULED', 'OUTBOUND_IN_PROGRESS', 'WITH_RENTER', 'RETURN_SCHEDULED', 'RETURN_IN_PROGRESS', 'RETURNED', 'COMPLETED') THEN 'APPROVED_BY_VENDOR'
        ELSE 'NOT_REQUIRED'
      END
    `);

    await queryInterface.changeColumn("reservations", "status", {
      type: Sequelize.ENUM(...NEW_RESERVATION_STATUS_VALUES),
      allowNull: false,
      defaultValue: "CART"
    });

    await queryInterface.changeColumn("reservations", "vendor_status", {
      type: Sequelize.ENUM(...NEW_VENDOR_STATUS_VALUES),
      allowNull: false,
      defaultValue: "NOT_REQUIRED"
    });

    await queryInterface.addColumn("payments", "payment_purpose", {
      type: Sequelize.ENUM("INITIAL_RESERVATION", "RESERVATION_ADJUSTMENT"),
      allowNull: false,
      defaultValue: "INITIAL_RESERVATION"
    });

    await queryInterface.addColumn("payments", "reservation_adjustment_id", {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true
    });

    await queryInterface.createTable("vendor_fulfillment_settings", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      vendor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      primary_location: {
        type: Sequelize.JSON,
        allowNull: true
      },
      outbound_mode: {
        type: Sequelize.ENUM("PICKUP", "DELIVERY", "BOTH"),
        allowNull: false,
        defaultValue: "BOTH"
      },
      return_mode: {
        type: Sequelize.ENUM("PICKUP", "DELIVERY", "BOTH"),
        allowNull: false,
        defaultValue: "BOTH"
      },
      outbound_pickup_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      outbound_delivery_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      return_pickup_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      return_delivery_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      service_areas: {
        type: Sequelize.JSON,
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.createTable("costume_fulfillment_overrides", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      costume_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: "costumes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      outbound_mode: {
        type: Sequelize.ENUM("PICKUP", "DELIVERY", "BOTH"),
        allowNull: false
      },
      return_mode: {
        type: Sequelize.ENUM("PICKUP", "DELIVERY", "BOTH"),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.createTable("user_saved_locations", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      label: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      contact_name: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING(60),
        allowNull: false
      },
      address_line_1: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      address_line_2: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      barangay: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      province: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      postal_code: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(120),
        allowNull: true,
        defaultValue: "Philippines"
      },
      area: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_default: {
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.createTable("reservation_fulfillment", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      reservation_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: "reservations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      outbound_method: {
        type: Sequelize.ENUM("PICKUP", "DELIVERY"),
        allowNull: false
      },
      return_method: {
        type: Sequelize.ENUM("PICKUP", "DELIVERY"),
        allowNull: false
      },
      outbound_location_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "user_saved_locations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      outbound_location_snapshot: {
        type: Sequelize.JSON,
        allowNull: true
      },
      return_location_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "user_saved_locations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      return_location_snapshot: {
        type: Sequelize.JSON,
        allowNull: true
      },
      pickup_window_start: {
        type: Sequelize.DATE,
        allowNull: true
      },
      pickup_window_end: {
        type: Sequelize.DATE,
        allowNull: true
      },
      delivery_window_start: {
        type: Sequelize.DATE,
        allowNull: true
      },
      delivery_window_end: {
        type: Sequelize.DATE,
        allowNull: true
      },
      return_window_start: {
        type: Sequelize.DATE,
        allowNull: true
      },
      return_window_end: {
        type: Sequelize.DATE,
        allowNull: true
      },
      outbound_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      return_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      outside_service_area: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      vendor_approval_status: {
        type: Sequelize.ENUM("PENDING_VENDOR_REVIEW", "APPROVED", "REJECTED"),
        allowNull: false,
        defaultValue: "PENDING_VENDOR_REVIEW"
      },
      vendor_approval_note: {
        type: Sequelize.TEXT,
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.createTable("reservation_adjustments", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      reservation_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: "reservations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      type: {
        type: Sequelize.ENUM("OUTSIDE_AREA_SURCHARGE"),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM("PENDING", "PAID", "WAIVED", "REJECTED"),
        allowNull: false,
        defaultValue: "PENDING"
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by_user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addConstraint("payments", {
      fields: ["reservation_adjustment_id"],
      type: "foreign key",
      name: "payments_reservation_adjustment_id_fk",
      references: {
        table: "reservation_adjustments",
        field: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("payments", "payments_reservation_adjustment_id_fk");

    await queryInterface.dropTable("reservation_adjustments");
    await queryInterface.dropTable("reservation_fulfillment");
    await queryInterface.dropTable("user_saved_locations");
    await queryInterface.dropTable("costume_fulfillment_overrides");
    await queryInterface.dropTable("vendor_fulfillment_settings");

    await queryInterface.removeColumn("payments", "reservation_adjustment_id");
    await queryInterface.removeColumn("payments", "payment_purpose");

    await queryInterface.changeColumn("reservations", "status", {
      type: Sequelize.ENUM(...new Set([...OLD_RESERVATION_STATUS_VALUES, ...NEW_RESERVATION_STATUS_VALUES])),
      allowNull: false,
      defaultValue: "CART"
    });

    await queryInterface.changeColumn("reservations", "vendor_status", {
      type: Sequelize.ENUM(...new Set([...OLD_VENDOR_STATUS_VALUES, ...NEW_VENDOR_STATUS_VALUES])),
      allowNull: false,
      defaultValue: "CONFIRMED"
    });

    await queryInterface.sequelize.query(`
      UPDATE reservations
      SET status = CASE
        WHEN status = 'CART' THEN 'CART'
        WHEN status = 'PENDING_PAYMENT' THEN 'PENDING_PAYMENT'
        WHEN status = 'CANCELLED' THEN 'CANCELLED'
        WHEN status = 'REJECTED_BY_VENDOR' THEN 'CANCELLED'
        ELSE 'PAID'
      END
    `);

    await queryInterface.sequelize.query(`
      UPDATE reservations
      SET vendor_status = CASE
        WHEN status = 'CANCELLED' AND vendor_status = 'REJECTED_BY_VENDOR' THEN 'REJECTED_BY_VENDOR'
        WHEN vendor_status = 'PENDING_VENDOR_REVIEW' THEN 'PENDING_VENDOR'
        WHEN vendor_status = 'APPROVED_BY_VENDOR' THEN 'CONFIRMED'
        WHEN vendor_status = 'REJECTED_BY_VENDOR' THEN 'REJECTED_BY_VENDOR'
        ELSE 'CONFIRMED'
      END
    `);

    await queryInterface.changeColumn("reservations", "status", {
      type: Sequelize.ENUM(...OLD_RESERVATION_STATUS_VALUES),
      allowNull: false,
      defaultValue: "CART"
    });

    await queryInterface.changeColumn("reservations", "vendor_status", {
      type: Sequelize.ENUM(...OLD_VENDOR_STATUS_VALUES),
      allowNull: false,
      defaultValue: "CONFIRMED"
    });
  }
};
