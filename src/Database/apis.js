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
  const snapshot = await getDocs(companiesCollection);
  return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }));
}

/**
 * Deletes a company from the Firestore 'companies' collection by its ID.
 * @param {string} companyId - The ID of the company to delete.
 * @throws {Error} If the company ID is missing.
 */
export async function deleteCompany(companyId) {
  if (!companyId) {
    throw new Error("Company ID is required");
  }

  const companyDoc = doc(db, "companies", companyId);
  await deleteDoc(companyDoc);
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
    arrivalDate: new Date(arrivalDate), // convert from input
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(stockArrivalDateCollection, newEntry);

  return {
    id: docRef.id,
    ...newEntry,
  };
}

export async function getStockArrivalDate(companyId) {
  if (!companyId) throw new Error("Company ID is required");

  const q = query(
    stockArrivalDateCollection,
    where("companyId", "==", companyId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
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