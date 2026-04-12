/**
 * Firebase Firestore API functions for managing companies in the JNTIMS application.
 * This module provides CRUD operations for the 'companies' collection in Firestore.
 */

import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
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
