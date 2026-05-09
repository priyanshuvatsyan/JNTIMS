import {
  addCompany,
  addStockArrivalDate,
  addStock,
  getCompanies
} from "./src/Database/apis.js";

const seedDummyData = async () => {
  try {
    console.log("🚀 Seeding started...");

    // 🔹 1. Add Companies
    const c1 = await addCompany({ name: "Sharma Electronics", phone: "9876543210" });
    const c2 = await addCompany({ name: "Gupta Distributors", phone: "9123456780" });
    const c3 = await addCompany({ name: "Raj Peripherals", phone: "9988776655" });

    console.log("✅ Companies added:", c1.id, c2.id, c3.id);

    // 🔹 2. Add Stock Arrival Dates
    const d1 = await addStockArrivalDate({ companyId: c1.id, amount: 250000, arrivalDate: "2026-04-15" });
    const d2 = await addStockArrivalDate({ companyId: c1.id, amount: 180000, arrivalDate: "2026-04-28" });
    const d3 = await addStockArrivalDate({ companyId: c2.id, amount: 95000,  arrivalDate: "2026-04-18" });
    const d4 = await addStockArrivalDate({ companyId: c3.id, amount: 120000, arrivalDate: "2026-05-01" });

    console.log("✅ Dates added:", d1.id, d2.id, d3.id, d4.id);

    // 🔹 3. Add Stock Items
    // --- Sharma Electronics - Arrival 1
    await addStock({ companyId: c1.id, entryId: d1.id, productName: "Dell Laptop i5",       boxes: 5,  unitsPerBox: 1,  boxPriceWithoutGst: 45000, boxPriceWithGst: 53100, unitPriceWithoutGst: 45000, unitPriceWithGst: 53100, sellingPrice: 58000, gst: 18 });
    await addStock({ companyId: c1.id, entryId: d1.id, productName: "HP Laptop i3",          boxes: 8,  unitsPerBox: 1,  boxPriceWithoutGst: 32000, boxPriceWithGst: 37760, unitPriceWithoutGst: 32000, unitPriceWithGst: 37760, sellingPrice: 42000, gst: 18 });
    await addStock({ companyId: c1.id, entryId: d1.id, productName: "Samsung 24\" Monitor",  boxes: 10, unitsPerBox: 1,  boxPriceWithoutGst: 12000, boxPriceWithGst: 14160, unitPriceWithoutGst: 12000, unitPriceWithGst: 14160, sellingPrice: 16500, gst: 18 });

    // --- Sharma Electronics - Arrival 2
    await addStock({ companyId: c1.id, entryId: d2.id, productName: "Lenovo ThinkPad",       boxes: 4,  unitsPerBox: 1,  boxPriceWithoutGst: 52000, boxPriceWithGst: 61360, unitPriceWithoutGst: 52000, unitPriceWithGst: 61360, sellingPrice: 67000, gst: 18 });
    await addStock({ companyId: c1.id, entryId: d2.id, productName: "LG 27\" 4K Monitor",    boxes: 6,  unitsPerBox: 1,  boxPriceWithoutGst: 22000, boxPriceWithGst: 25960, unitPriceWithoutGst: 22000, unitPriceWithGst: 25960, sellingPrice: 29000, gst: 18 });

    // --- Gupta Distributors
    await addStock({ companyId: c2.id, entryId: d3.id, productName: "Logitech Wireless Mouse", boxes: 20, unitsPerBox: 5,  boxPriceWithoutGst: 2500,  boxPriceWithGst: 2950,  unitPriceWithoutGst: 500,  unitPriceWithGst: 590,  sellingPrice: 750,  gst: 18 });
    await addStock({ companyId: c2.id, entryId: d3.id, productName: "Mechanical Keyboard",     boxes: 15, unitsPerBox: 2,  boxPriceWithoutGst: 3200,  boxPriceWithGst: 3776,  unitPriceWithoutGst: 1600, unitPriceWithGst: 1888, sellingPrice: 2200, gst: 18 });
    await addStock({ companyId: c2.id, entryId: d3.id, productName: "USB-C Hub 7-in-1",        boxes: 25, unitsPerBox: 10, boxPriceWithoutGst: 8000,  boxPriceWithGst: 9440,  unitPriceWithoutGst: 800,  unitPriceWithGst: 944,  sellingPrice: 1200, gst: 18 });
    await addStock({ companyId: c2.id, entryId: d3.id, productName: "HDMI Cable 2m",           boxes: 30, unitsPerBox: 20, boxPriceWithoutGst: 1800,  boxPriceWithGst: 2124,  unitPriceWithoutGst: 90,   unitPriceWithGst: 106,  sellingPrice: 149,  gst: 18 });

    // --- Raj Peripherals (some low/out of stock for testing)
    await addStock({ companyId: c3.id, entryId: d4.id, productName: "Boat Earphones",          boxes: 2,  unitsPerBox: 2,  boxPriceWithoutGst: 1200,  boxPriceWithGst: 1416,  unitPriceWithoutGst: 600,  unitPriceWithGst: 708,  sellingPrice: 899,  gst: 18 });
    await addStock({ companyId: c3.id, entryId: d4.id, productName: "Webcam 1080p",             boxes: 1,  unitsPerBox: 1,  boxPriceWithoutGst: 2800,  boxPriceWithGst: 3304,  unitPriceWithoutGst: 2800, unitPriceWithGst: 3304, sellingPrice: 3999, gst: 18 });
    await addStock({ companyId: c3.id, entryId: d4.id, productName: "Laptop Cooling Pad",       boxes: 8,  unitsPerBox: 3,  boxPriceWithoutGst: 1500,  boxPriceWithGst: 1770,  unitPriceWithoutGst: 500,  unitPriceWithGst: 590,  sellingPrice: 799,  gst: 18 });

    console.log("🎉 Dummy data seeded successfully!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
};

(async () => {
  await seedDummyData();
})();