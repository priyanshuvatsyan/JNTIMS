/**
 * Firebase Firestore API functions for managing companies in the JNTIMS application.
 * This module provides CRUD operations for the 'companies' collection in Firestore.
 */

import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, serverTimestamp,query, where } from "firebase/firestore";
import { db } from "../../firebase.js";



// Reference to the 'companies' collection in Firestore
const companiesCollection = collection(db, "companies");

/**
 * Adds a new company to the Firestore 'companies' collection.
 * @param {Object} company - The company data to add.
 * @param {string} company.name - The name of the company (required).
 * @param {string} [company.phone] - The phone number of the company (optional).
 * @returns {Promise<Object>} A promise that resolves to the added company object with its ID.
 * @throws {Error} If the company name is missing or invalid.
 */
export async function addCompany(company) { 
  if (!company?.name?.trim()) {
    throw new Error("Company name is required");
  }

  const newCompany = {
    name: company.name.trim(),
    phone: company.phone?.trim() || "",
    createdAt: serverTimestamp(), // Firestore server timestamp for creation time
  };

  const docRef = await addDoc(companiesCollection, newCompany);
  return { id: docRef.id, ...newCompany };
}

/**
 * Retrieves all companies from the Firestore 'companies' collection.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of company objects, each with an 'id' field.
 */
export async function getCompanies() {
  try {
    const snapshot = await getDocs(companiesCollection);
    const companies = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }));
    console.log('getCompanies API result:', companies);
    return companies;
  } catch (error) {
    console.error('Error in getCompanies:', error);
    throw error;
  }
}

/**
 * Deletes a company and everything realted to it (arrival date,stockItems) from the Firestore 'companies' collection by its ID.
 * @param {string} companyId - The ID of the company to delete.
 * @throws {Error} If the company ID is missing.
 */

export async function deleteCompany(companyId) {
  if (!companyId) throw new Error("Company ID is required");

  try {
    // 🔹 delete stockData
    const stockQuery = query(
      stockDataCollection,
      where("companyId", "==", companyId)
    );

    const stockSnapshot = await getDocs(stockQuery);
    await Promise.all(stockSnapshot.docs.map(doc => deleteDoc(doc.ref)));

    // 🔹 delete stockArrivalDate
    const arrivalQuery = query(
      stockArrivalDateCollection,
      where("companyId", "==", companyId)
    );

    const arrivalSnapshot = await getDocs(arrivalQuery);
    await Promise.all(arrivalSnapshot.docs.map(doc => deleteDoc(doc.ref)));

    // 🔹 delete company
    const companyDoc = doc(db, "companies", companyId);
    await deleteDoc(companyDoc);

  } catch (error) {
    console.error("Cascade delete failed:", error);
    throw error;
  }
}

/**
 * Updates an existing company in the Firestore 'companies' collection.
 * @param {string} companyId - The ID of the company to update.
 * @param {Object} data - The data to update (e.g., { name: "New Name", phone: "123-456" }).
 * @throws {Error} If the company ID is missing.
 */
export async function updateCompany(companyId, data) {
  if (!companyId) {
    throw new Error("Company ID is required");
  }

  const companyDoc = doc(db, "companies", companyId);
  await updateDoc(companyDoc, data);
}


const stockArrivalDateCollection = collection(db, "stockArrivalDate");

export async function addStockArrivalDate(data) {
  const { companyId, amount, arrivalDate } = data;

  if (!companyId) throw new Error("Company ID is required");
  if (!arrivalDate) throw new Error("Arrival date is required");
  if (!amount || amount <= 0) throw new Error("Valid amount is required");

  const newEntry = {
    companyId,
    amount: Number(amount),
    arrivalDate: new Date(arrivalDate), // Firestore will convert to Timestamp
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(stockArrivalDateCollection, newEntry);

  return {
    id: docRef.id,
    companyId,
    amount: Number(amount),
    arrivalDate: new Date(arrivalDate), // Return JS Date for consistency
    createdAt: new Date(),
  };
}

// 🔹 1. General (all data)
export async function getAllStockArrivalDates() {
  const snapshot = await getDocs(stockArrivalDateCollection);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      companyId: data.companyId,
      amount: data.amount,
      arrivalDate: data.arrivalDate?.toDate?.() || new Date(data.arrivalDate),
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
    };
  });
}

// 🔹 2. Filtered (by company)
export async function getStockArrivalDate_basedOnCompany(companyId) {
  if (!companyId) throw new Error("Company ID is required");

  const q = query(
    stockArrivalDateCollection,
    where("companyId", "==", companyId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      companyId: data.companyId,
      amount: data.amount,
      arrivalDate: data.arrivalDate?.toDate?.() || new Date(data.arrivalDate),
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
    };
  });
}

export async function editStockArrivalDate(entryId, data) {
  if (!entryId) throw new Error("Entry ID is required");

  const entryDoc = doc(db, "stockArrivalDate", entryId);

  const updatedData = {};

  if (data.amount !== undefined) {
    if (data.amount <= 0) throw new Error("Amount must be > 0");
    updatedData.amount = Number(data.amount);
  }

  if (data.arrivalDate) {
    updatedData.arrivalDate = new Date(data.arrivalDate);
  }

  await updateDoc(entryDoc, updatedData);
}

export async function deleteStockArrivalDate(entryId) {
  if (!entryId) throw new Error("Entry ID is required");

  const entryDoc = doc(db, "stockArrivalDate", entryId);
  await deleteDoc(entryDoc);
}


const stockDataCollection = collection(db, "stockData");

export async function addStock(data) {
  const {
    companyId,
    entryId,
    productName,
    boxes,
    unitsPerBox,
    boxPriceWithoutGst,
    boxPriceWithGst,        // coming from UI
    unitPriceWithoutGst,    // coming from UI
    unitPriceWithGst,       // coming from UI
    sellingPrice,
    gst
  } = data;

  // 🔒 Basic validation
  if (!companyId) throw new Error("Company ID required");
  if (!entryId) throw new Error("Entry ID required");
  if (!productName?.trim()) throw new Error("Product name required");

  if (!boxes || boxes <= 0) throw new Error("Boxes must be > 0");
  if (!unitsPerBox || unitsPerBox <= 0) throw new Error("Units per box must be > 0");
  if (!boxPriceWithoutGst || boxPriceWithoutGst <= 0) throw new Error("Invalid box price");

  // 🔢 Convert to numbers
  const boxesNum = Number(boxes);
  const unitsPerBoxNum = Number(unitsPerBox);
  const boxPriceNum = Number(boxPriceWithoutGst);
  const gstNum = Number(gst || 0);

  const totalUnits = boxesNum * unitsPerBoxNum;

  // 🧠 Recompute expected values (SOURCE OF TRUTH)
  const expectedBoxPriceWithGst =
    boxPriceNum + (boxPriceNum * gstNum) / 100;

  const expectedUnitPriceWithoutGst =
    boxPriceNum / unitsPerBoxNum;

  const expectedUnitPriceWithGst =
    expectedBoxPriceWithGst / unitsPerBoxNum;

  // 🔍 Optional validation check (for debugging/logging)
  const isClose = (a, b) => Math.abs(a - b) < 0.01;

  if (
    !isClose(boxPriceWithGst, expectedBoxPriceWithGst) ||
    !isClose(unitPriceWithoutGst, expectedUnitPriceWithoutGst) ||
    !isClose(unitPriceWithGst, expectedUnitPriceWithGst)
  ) {
    console.warn("⚠️ UI calculation mismatch — overriding with backend values");
  }

  // ✅ FINAL DATA (always use backend computed values)
  const newStock = {
    companyId,
    entryId,

    productName: productName.trim(),

    boxes: boxesNum,
    unitsPerBox: unitsPerBoxNum,
    totalUnits,

    boxPriceWithoutGst: boxPriceNum,
    boxPriceWithGst: expectedBoxPriceWithGst,

    unitPriceWithoutGst: expectedUnitPriceWithoutGst,
    unitPriceWithGst: expectedUnitPriceWithGst,

    sellingPrice: Number(sellingPrice),
    gst: gstNum,

    remainingQty: totalUnits,

    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(stockDataCollection, newStock);

  return {
    id: docRef.id,
    ...newStock
  };
}

export async function getAllStock() {
  const snapshot = await getDocs(stockDataCollection);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getStocksByFilters(filters = {}) {
  const { companyId, entryId } = filters;

  if (!companyId && !entryId) {
    return getAllStock();
  }

  let q = stockDataCollection;

  if (companyId) {
    q = query(q, where('companyId', '==', companyId));
  }

  if (entryId) {
    q = query(q, where('entryId', '==', entryId));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

//Get Stock by Company (very important)
export async function getStockByCompany(companyId) {
  if (!companyId) throw new Error("Company ID required");

  const q = query(
    stockDataCollection,
    where("companyId", "==", companyId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

//Get Stock by Entry (date)
export async function getStockByEntry(entryId) {
  if (!entryId) throw new Error("Entry ID required");

  const q = query(
    stockDataCollection,
    where("entryId", "==", entryId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function updateStock(stockId, data) {
  if (!stockId) throw new Error("Stock ID required");

  const stockDoc = doc(db, "stockData", stockId);
  await updateDoc(stockDoc, data);
}


export async function deleteStock(stockId) {
  if (!stockId) throw new Error("Stock ID required");

  const stockDoc = doc(db, "stockData", stockId);
  await deleteDoc(stockDoc);
}