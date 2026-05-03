import { db } from "./models";
import bcrypt from "bcryptjs";

const seedData = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected.");
    
    // Create users
    const passwordHash = await bcrypt.hash("password123", 10);
    
    // Vendor User 1
    const vendor1 = await db.User.create({
      email: "vendor1@snapcos.com",
      password_hash: passwordHash,
      name: "Alice Wonderland",
      role: "USER",
      vendor_status: "APPROVED"
    });
    
    await db.VendorProfile.create({
      user_id: vendor1.id,
      business_name: "Alice's Wardrobe",
      bio: "High quality cosplay costumes from your favorite anime and games.",
      id_document_url: "https://example.com/id.pdf"
    });

    // Costume 1
    const costume1 = await db.Costume.create({
      name: "Genshin Impact - Raiden Shogun",
      description: "Complete Raiden Shogun cosplay set including dress, accessories, and vision. Excellent quality, worn only once.",
      category: "Anime & Gaming",
      size: "M",
      gender: "Women",
      theme: "Genshin Impact",
      base_price_per_day: 15.00,
      deposit_amount: 50.00,
      stock: 1,
      owner_id: vendor1.id,
      status: "ACTIVE"
    });
    
    await db.CostumeImage.create({ costume_id: costume1.id, image_url: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=1000", is_primary: true });

    // Costume 2
    const costume2 = await db.Costume.create({
      name: "Spider-Man Miles Morales Suit",
      description: "High-quality lycra Spiderman suit from Into the Spider-Verse. Very stretchable and comfortable.",
      category: "Superheroes",
      size: "L",
      gender: "Unisex",
      theme: "Marvel",
      base_price_per_day: 12.00,
      deposit_amount: 30.00,
      stock: 2,
      owner_id: vendor1.id,
      status: "ACTIVE"
    });

    await db.CostumeImage.create({ costume_id: costume2.id, image_url: "https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&q=80&w=1000", is_primary: true });

    // Vendor User 2
    const vendor2 = await db.User.create({
      email: "vendor2@snapcos.com",
      password_hash: passwordHash,
      name: "Bob Builder",
      role: "USER",
      vendor_status: "APPROVED"
    });

    await db.VendorProfile.create({
      user_id: vendor2.id,
      business_name: "Cosplay Crafters",
      bio: "Handmade armors and fantasy outfits.",
      id_document_url: "https://example.com/id2.pdf"
    });

    // Costume 3
    const costume3 = await db.Costume.create({
      name: "Medieval Knight Armor Set",
      description: "Full set of medieval armor made from high-density EVA foam. Looks like real metal but lightweight.",
      category: "Historical & Fantasy",
      size: "XL",
      gender: "Men",
      theme: "Medieval",
      base_price_per_day: 25.00,
      deposit_amount: 100.00,
      stock: 1,
      owner_id: vendor2.id,
      status: "ACTIVE"
    });

    await db.CostumeImage.create({ costume_id: costume3.id, image_url: "https://images.unsplash.com/photo-1594955431690-67c1e550970a?auto=format&fit=crop&q=80&w=1000", is_primary: true });

    // Customer User
    const customer = await db.User.create({
      email: "customer@snapcos.com",
      password_hash: passwordHash,
      name: "Charlie Customer",
      role: "USER",
      vendor_status: "NONE"
    });

    // Reservation
    const tomorrow = new Date(Date.now() + 86400000);
    const threeDaysLater = new Date(Date.now() + 86400000 * 3);
    const reservation = await db.Reservation.create({
      user_id: customer.id,
      start_date: tomorrow.toISOString().split('T')[0], // YYYY-MM-DD
      end_date: threeDaysLater.toISOString().split('T')[0],
      total_price: 36.00,
      status: "PENDING_PAYMENT"
    });

    await db.ReservationItem.create({
      reservation_id: reservation.id,
      costume_id: costume2.id,
      quantity: 1,
      price_per_day: 12.00,
      subtotal: 36.00
    });

    console.log("Database seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedData();
