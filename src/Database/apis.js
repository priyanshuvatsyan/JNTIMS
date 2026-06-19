/**
 * Firebase Firestore API functions for managing companies in the JNTIMS application.
 * This module provides CRUD operations for the 'companies' collection in Firestore.
 */

import { collection, addDoc, limit, getDocs, getDoc, Timestamp, writeBatch, deleteDoc, updateDoc, doc, serverTimestamp, query, where, orderBy, startAt, endAt } from "firebase/firestore";
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
 * Delete only the company-related data (stockData and stockArrivalDate)
 * but keep the company document itself.
 */
export async function deleteCompanyData(companyId) {
  if (!companyId) throw new Error("Company ID is required");

  try {
    const stockQuery = query(
      stockDataCollection,
      where("companyId", "==", companyId)
    );

    const stockSnapshot = await getDocs(stockQuery);
    await Promise.all(stockSnapshot.docs.map(doc => deleteDoc(doc.ref)));

    const arrivalQuery = query(
      stockArrivalDateCollection,
      where("companyId", "==", companyId)
    );

    const arrivalSnapshot = await getDocs(arrivalQuery);
    await Promise.all(arrivalSnapshot.docs.map(doc => deleteDoc(doc.ref)));
    // Delete manual dues (balance payable)
    try {
      const manualQuery = query(manualDuesCollection, where('companyId', '==', companyId));
      const manualSnap = await getDocs(manualQuery);
      await Promise.all(manualSnap.docs.map(doc => deleteDoc(doc.ref)));
    } catch (err) {
      // if manualDuesCollection is not yet defined or empty, ignore
      console.warn('manual dues deletion warning', err);
    }

    // Delete payments and sales related to this company
    try {
      const paymentsCol = collection(db, 'payments');
      const paymentsQuery = query(paymentsCol, where('companyId', '==', companyId));
      const paymentsSnap = await getDocs(paymentsQuery);
      await Promise.all(paymentsSnap.docs.map(doc => deleteDoc(doc.ref)));
    } catch (err) {
      console.warn('payments deletion warning', err);
    }

    try {
      const salesCol = collection(db, 'sales');
      const salesQuery = query(salesCol, where('companyId', '==', companyId));
      const salesSnap = await getDocs(salesQuery);
      await Promise.all(salesSnap.docs.map(doc => deleteDoc(doc.ref)));
    } catch (err) {
      console.warn('sales deletion warning', err);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete company data:', error);
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
    isPaid: false,    // Track payment status
    paidAt: null,     // Track payment date
    paidAmount: 0,
    remainingAmount: Number(amount),  // starts equal to amount
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(stockArrivalDateCollection, newEntry);

  return {
    id: docRef.id,
    companyId,
    amount: Number(amount),
    arrivalDate: new Date(arrivalDate), // Return JS Date for consistency
    isPaid: false,    // Track payment status
    paidAt: null,     // Track payment date
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

  //storing company name and entry date details for easy querying and data integrity (denormalization) 
  const [companySnap, dateSnap] = await Promise.all([
    getDoc(doc(db, 'companies', companyId)),
    getDoc(doc(db, 'stockArrivalDate', entryId)),
  ]);

  if (!companySnap.exists()) throw new Error('Company not found');
  if (!dateSnap.exists()) throw new Error('Stock arrival date not found');

  const companyName = companySnap.data().name;
  const arrivalDate = dateSnap.data().arrivalDate;

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

    companyName,
    arrivalDate,

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

// export async function updateStock(stockId, data) {
//   if (!stockId) throw new Error("Stock ID required");

//   const stockDoc = doc(db, "stockData", stockId);
//   await updateDoc(stockDoc, data);
// }


export async function deleteStock(stockId) {
  if (!stockId) throw new Error("Stock ID required");

  const stockDoc = doc(db, "stockData", stockId);
  await deleteDoc(stockDoc);
}



export const updateStock = async (stockId, data) => {
  const [companySnap, dateSnap] = await Promise.all([
    getDoc(doc(db, 'companies', data.companyId)),
    getDoc(doc(db, 'stockArrivalDate', data.entryId)),
  ]);

  if (!companySnap.exists()) throw new Error('Company not found');
  if (!dateSnap.exists()) throw new Error('Stock arrival date not found');

  const stockRef = doc(db, 'stockData', stockId);
  await updateDoc(stockRef, {
    ...data,
    companyName: companySnap.data().name,
    arrivalDate: dateSnap.data().arrivalDate,
  });
};


//Sales Page
export async function searchStock(searchTerm) {
  if (!searchTerm.trim()) {
    // Return all when empty — but add limit in production
    const snapshot = await getDocs(query(stockDataCollection, orderBy('productName')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Firestore startsWith trick
  const term = searchTerm.trim();
  const end = term.slice(0, -1) + String.fromCharCode(term.charCodeAt(term.length - 1) + 1);

  const q = query(
    stockDataCollection,
    orderBy('productName'),
    startAt(term),
    endAt(end)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function makeSale(data) {
  const { stockId, quantitySold, customerName } = data;

  // ─── Validation ───────────────────────────────────────
  if (!stockId) throw new Error("Stock ID is required");
  if (!quantitySold || quantitySold <= 0) throw new Error("Quantity must be greater than 0");

  // ─── Fetch stock document (source of truth) ───────────
  const stockRef = doc(db, 'stockData', stockId);
  const stockSnap = await getDoc(stockRef);

  if (!stockSnap.exists()) throw new Error("Stock item not found");

  const stock = stockSnap.data();

  // ─── Check stock availability ─────────────────────────
  if (stock.remainingQty < quantitySold) {
    throw new Error(`Only ${stock.remainingQty} units available`);
  }

  // ─── Calculate financials ─────────────────────────────
  const sellingPrice = stock.sellingPrice;
  const costPrice = stock.unitPriceWithGst; // what you paid per unit
  const totalRevenue = sellingPrice * quantitySold;
  const totalCost = costPrice * quantitySold;
  const totalProfit = totalRevenue - totalCost;
  const newRemainingQty = stock.remainingQty - quantitySold;

  // ─── Save sale record ─────────────────────────────────
  const saleData = {
    stockId,
    companyId: stock.companyId,
    entryId: stock.entryId,
    companyName: stock.companyName,
    arrivalDate: stock.arrivalDate,
    productName: stock.productName,

    quantitySold: Number(quantitySold),
    sellingPrice,
    costPrice,
    totalRevenue,
    totalCost,
    totalProfit,

    customerName: customerName?.trim() || null,
    timestamp: serverTimestamp(),
  };

  // ─── Run both writes together ─────────────────────────
  const batch = writeBatch(db);

  // 1. Save the sale
  const saleRef = doc(collection(db, 'sales'));
  batch.set(saleRef, saleData);

  // 2. Deduct from stock
  batch.update(stockRef, { remainingQty: newRemainingQty });

  await batch.commit();

  return { id: saleRef.id, ...saleData };
}

export async function getRecentSales(limitCount = 30) {
  const q = query(
    collection(db, 'sales'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


//get sales status for sales page header
export async function getTodaysSalesStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'sales'),
    where('timestamp', '>=', Timestamp.fromDate(startOfDay))
  );

  const snapshot = await getDocs(q);
  let todaysSales = 0;
  let unitsSold = 0;
  const transactions = snapshot.size;

  snapshot.forEach(doc => {
    const data = doc.data();
    todaysSales += data.totalRevenue || 0;
    unitsSold += data.quantitySold || 0;
  });

  return { todaysSales, unitsSold, transactions };
}

export async function getBillsStats() {
  const [companiesSnap, datesSnap] = await Promise.all([
    getDocs(companiesCollection),
    getDocs(stockArrivalDateCollection),
  ]);

  // Build companies map for name lookup
  const companiesMap = {};
  companiesSnap.forEach(doc => {
    companiesMap[doc.id] = { id: doc.id, ...doc.data() };
  });

  let totalPayable = 0;
  let totalPaid = 0;
  let pendingItems = 0;
  const companyTotals = {};

  datesSnap.forEach(doc => {
    const data = doc.data();
    const amount = data.amount || 0;

    if (data.isPaid) {
      totalPaid += amount;
    } else {
      totalPayable += amount;
      pendingItems += 1;

      if (!companyTotals[data.companyId]) {
        companyTotals[data.companyId] = {
          companyId: data.companyId,
          companyName: companiesMap[data.companyId]?.name || 'Unknown',
          totalPending: 0,
          pendingEntries: 0,
        };
      }
      companyTotals[data.companyId].totalPending += amount;
      companyTotals[data.companyId].pendingEntries += 1;
    }
  });

  return {
    totalPayable,
    totalPaid,
    pendingItems,
    companiesCount: Object.keys(companyTotals).length,
    companiesList: Object.values(companyTotals),
  };
}

export async function getOutstandingBalances() {
  const [companiesSnap, datesSnap, manualSnap] = await Promise.all([
    getDocs(companiesCollection),
    getDocs(stockArrivalDateCollection),
    getDocs(query(manualDuesCollection, where('isPaid', '==', false))), // 👈 add
  ]);

  const companiesMap = {};
  companiesSnap.forEach(doc => {
    companiesMap[doc.id] = { id: doc.id, ...doc.data() };
  });

  const balances = {};

  // Stock arrival dues
  datesSnap.forEach(doc => {
    const data = doc.data();
    if (!data.isPaid) {
      const companyId = data.companyId;
      if (!balances[companyId]) {
        balances[companyId] = {
          companyId,
          companyName: companiesMap[companyId]?.name || 'Unknown',
          totalDue: 0,
        };
      }
      balances[companyId].totalDue += data.remainingAmount ?? data.amount ?? 0;
    }
  });

  // Manual dues 👈 add this block
  manualSnap.forEach(doc => {
    const data = doc.data();
    const companyId = data.companyId;
    if (!balances[companyId]) {
      balances[companyId] = {
        companyId,
        companyName: companiesMap[companyId]?.name || 'Unknown',
        totalDue: 0,
      };
    }
    balances[companyId].totalDue += data.remainingAmount ?? data.amount ?? 0;
  });

  return Object.values(balances).sort((a, b) => b.totalDue - a.totalDue);
}
// Mark a stockArrivalDate entry as paid
export async function markEntryAsPaid(entryId) {
  if (!entryId) throw new Error("Entry ID is required");
  const entryDoc = doc(db, 'stockArrivalDate', entryId);
  await updateDoc(entryDoc, {
    isPaid: true,
    paidAt: serverTimestamp(),
  });
}

//payments
export async function makePayment({ companyId, amount, paymentDate = null, checkNumber = null, note = '', paymentMode = 'cash' }) {
  if (!companyId) throw new Error("Company ID is required");
  if (!amount || amount <= 0) throw new Error("Amount must be greater than 0");

  const companySnap = await getDoc(doc(db, 'companies', companyId));
  if (!companySnap.exists()) throw new Error("Company not found");
  const companyName = companySnap.data().name;

  // Fetch both collections in parallel
  const [stockSnap, manualSnap] = await Promise.all([
    getDocs(query(
      stockArrivalDateCollection,
      where('companyId', '==', companyId),
      where('isPaid', '==', false),
      orderBy('arrivalDate', 'asc')
    )),
    getDocs(query(
      manualDuesCollection,
      where('companyId', '==', companyId),
      where('isPaid', '==', false),
      orderBy('dueDate', 'asc')
    )),
  ]);

  const stockEntries = stockSnap.docs.map(d => ({ id: d.id, _col: 'stockArrivalDate', ...d.data() }));
  const manualEntries = manualSnap.docs.map(d => ({ id: d.id, _col: 'manualDues', ...d.data() }));

  // Stock first, manual after — change order here if you want manual first
const allEntries = [...manualEntries, ...stockEntries];

  if (allEntries.length === 0) throw new Error("No pending dues for this company");

  const batch = writeBatch(db);
  let remaining = amount;
  const entriesCleared = [];

  for (const entry of allEntries) {
    if (remaining <= 0) break;

    const entryRemaining = entry.remainingAmount ?? entry.amount;
    const entryRef = doc(db, entry._col, entry.id);

    if (remaining >= entryRemaining) {
      batch.update(entryRef, {
        paidAmount: entry.amount,
        remainingAmount: 0,
        isPaid: true,
        paidAt: serverTimestamp(),
      });
      entriesCleared.push(entry.id);
      remaining -= entryRemaining;
    } else {
      batch.update(entryRef, {
        paidAmount: (entry.paidAmount || 0) + remaining,
        remainingAmount: entryRemaining - remaining,
        isPaid: false,
      });
      remaining = 0;
    }
  }

  const paymentRef = doc(collection(db, 'payments'));
  batch.set(paymentRef, {
    companyId,
    companyName,
    amount,
    paymentDate: paymentDate ? new Date(paymentDate) : serverTimestamp(),
    checkNumber: checkNumber || null,
    note: note?.trim() || null,
    paymentMode,
    entriesCleared,
    createdAt: serverTimestamp(),
  });

  await batch.commit();

  return {
    success: true,
    amountApplied: amount,
    excessAmount: remaining > 0 ? remaining : 0,
    entriesCleared,
  };
}
export async function getPaymentHistory(limitCount = 50) {
  const q = query(
    collection(db, 'payments'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

const manualDuesCollection = collection(db, 'manualDues');
export async function addManualDue({ companyId, amount, note }) {
  if (!companyId) throw new Error('Company ID is required');
  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');

  const companySnap = await getDoc(doc(db, 'companies', companyId));
  if (!companySnap.exists()) throw new Error('Company not found');

  const newDue = {
    companyId,
    companyName: companySnap.data().name,
    amount: Number(amount),
    remainingAmount: Number(amount),
    paidAmount: 0,
    isPaid: false,
    paidAt: null,
    note: note?.trim() || null,
    dueDate: new Date(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(manualDuesCollection, newDue);
  return { id: docRef.id, ...newDue };
}


//analytics calculations
export async function getAnalyticsStats(months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);

  // Fetch all three in parallel
  const [salesSnap, stockSnap, companiesSnap] = await Promise.all([
    getDocs(query(
      collection(db, 'sales'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'asc')
    )),
    getDocs(stockDataCollection),
    getDocs(companiesCollection),
  ]);

  // ── Sales stats ──
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalCost = 0;
  let unitsSold = 0;
  let transactions = 0;

  // For chart — group by month
  const monthlyMap = {};

  salesSnap.forEach(doc => {
    const s = doc.data();
    totalRevenue += s.totalRevenue || 0;
    totalProfit  += s.totalProfit  || 0;
    totalCost    += s.totalCost    || 0;
    unitsSold    += s.quantitySold || 0;
    transactions += 1;

    // Group by month for chart
    const date = s.timestamp?.toDate?.() || new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, profit: 0 };
    monthlyMap[key].revenue += s.totalRevenue || 0;
    monthlyMap[key].profit  += s.totalProfit  || 0;
  });

  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  

  // ── Stock stats ──
  let totalStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  const activeCompanyIds = new Set();

  stockSnap.forEach(doc => {
    const s = doc.data();
    totalStock += s.remainingQty || 0;
    if (s.remainingQty === 0) outOfStock += 1;
    if (s.remainingQty > 0 && s.remainingQty <= 5) lowStock += 1;
    if (s.remainingQty > 0) activeCompanyIds.add(s.companyId);
  });

  // ── Company stats ──
  const totalCompanies = companiesSnap.size;
  const activeCompanies = activeCompanyIds.size;

  // ── Stock Movement ──
const stockMovementMap = {};

  // Stock IN — from stockData createdAt
stockSnap.forEach(doc => {
  const s = doc.data();
  const date = s.createdAt?.toDate?.() || new Date();
  if (date >= startDate) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!stockMovementMap[key]) stockMovementMap[key] = { month: key, in: 0, out: 0 };
    stockMovementMap[key].in += s.totalUnits || 0;
  }
});

// Stock OUT — from sales quantitySold (already fetched in salesSnap)
salesSnap.forEach(doc => {
  const s = doc.data();
  const date = s.timestamp?.toDate?.() || new Date();
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (!stockMovementMap[key]) stockMovementMap[key] = { month: key, in: 0, out: 0 };
  stockMovementMap[key].out += s.quantitySold || 0;
});

const stockMovementData = Object.values(stockMovementMap)
  .sort((a, b) => a.month.localeCompare(b.month));


  return {
    // Cards
    totalRevenue,
    totalProfit,
    totalCost,
    profitMargin,
    unitsSold,
    transactions,
    totalStock,
    lowStock,
    outOfStock,
    totalCompanies,
    activeCompanies,

    // Chart
    monthlyData, // [{ month: "2026-01", revenue: 50000, profit: 12000 }, ...]

    stockMovementData, // [{ month: "2026-01", in: 450, out: 320 }, ...]
  };
}