import {
  addCompany,
  addStockArrivalDate,
  addStock,
  getCompanies
} from "./src/Database/apis.js"; // adjust path if needed

const seedDummyData = async () => {
  try {
    console.log("🚀 Seeding started...");

    // 🔒 Prevent duplicate data
    const existing = await getCompanies();
    if (existing.length > 0) {
      console.log("⚠️ Data already exists. Skipping seeding.");
      return;
    }

    // 🔹 1. Add Companies
    const c1 = await addCompany({
      name: "ABC Traders",
      phone: "9876543210"
    });

    const c2 = await addCompany({
      name: "XYZ Distributors",
      phone: "9123456780"
    });

    console.log("✅ Companies added:", c1.id, c2.id);

    // 🔹 2. Add Stock Arrival Dates
    const d1 = await addStockArrivalDate({
      companyId: c1.id,
      amount: 50000,
      arrivalDate: "2026-04-20"
    });

    const d2 = await addStockArrivalDate({
      companyId: c2.id,
      amount: 30000,
      arrivalDate: "2026-04-21"
    });

    console.log("✅ Dates added:", d1.id, d2.id);

    // 🔹 3. Add Stock Items
    await addStock({
      companyId: c1.id,
      entryId: d1.id,
      productName: "Laptop",
      boxes: 5,
      unitsPerBox: 10,
      boxPriceWithoutGst: 50000,
      boxPriceWithGst: 59000,
      unitPriceWithoutGst: 5000,
      unitPriceWithGst: 5900,
      sellingPrice: 6500,
      gst: 18
    });

    await addStock({
      companyId: c2.id,
      entryId: d2.id,
      productName: "Keyboard",
      boxes: 10,
      unitsPerBox: 20,
      boxPriceWithoutGst: 2000,
      boxPriceWithGst: 2360,
      unitPriceWithoutGst: 100,
      unitPriceWithGst: 118,
      sellingPrice: 150,
      gst: 18
    });

    console.log("🎉 Dummy data seeded successfully!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
};


// 🔥 IMPORTANT: CALL THE FUNCTION
(async () => {
  await seedDummyData();
})();