import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AddCompanies from '../components/AddCompanies';
import { deleteDoc, doc } from 'firebase/firestore';

import './styles/AllCompanies.css';

// Helper function to delete a collection recursively
const deleteCollection = async (collectionRef) => {
  console.log(`Starting to delete collection: ${collectionRef.path}`);
  const snapshot = await getDocs(collectionRef);
  console.log(`Found ${snapshot.docs.length} documents in ${collectionRef.path}`);
  const deletePromises = snapshot.docs.map(async (docSnap) => {
    console.log(`Deleting document: ${docSnap.ref.path}`);
    // For arrivalDates, delete subcollection stockItems first
    if (collectionRef.id === 'arrivalDates') {
      const itemsRef = collection(docSnap.ref, 'stockItems');
      await deleteCollection(itemsRef);
    }
    await deleteDoc(docSnap.ref);
    console.log(`Deleted document: ${docSnap.ref.path}`);
  });
  await Promise.all(deletePromises);
  console.log(`Finished deleting collection: ${collectionRef.path}`);
};

export default function AllCompanies() {

  const [companies, setCompanies] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);


  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const snapshoty = await getDocs(collection(db, 'companies'));
      const data = snapshoty.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies: ", error);
    } finally {
      setLoading(false);
    }
  }
  const handleDelete = async () => {
    if (!companyToDelete) return;
    console.log(`Starting delete for companyId: ${companyToDelete}`);
    const company = companies.find(c => c.id === companyToDelete);
    console.log(`Found company to delete:`, company);
    // Optimistically remove from UI
    setCompanies(prev => prev.filter(c => c.id !== companyToDelete));
    try {
      setDeletingId(companyToDelete);
      // Delete subcollections first
      const paymentsRef = collection(db, 'companies', companyToDelete, 'payments');
      console.log(`Deleting payments for company: ${companyToDelete}`);
      await deleteCollection(paymentsRef);

      const stockArrivalDatesRef = collection(db, 'companies', companyToDelete, 'arrivalDates');
      console.log(`Deleting arrivalDates for company: ${companyToDelete}`);
      await deleteCollection(stockArrivalDatesRef);

      // Now delete the company document
      console.log(`Deleting company document: companies/${companyToDelete}`);
      await deleteDoc(doc(db, 'companies', companyToDelete));
      console.log('Company and all associated data deleted successfully from DB');
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Error deleting company and data from DB:', error);
      // Revert the UI change if DB delete fails
      setCompanies(prev => [...prev, company]);
      alert('Failed to delete company and associated data from database. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };


  useEffect(() => {
    fetchCompanies();
  }, []);


  return (
    <div className="companies-wrapper">
      <h3>All Companies</h3>
      {loading ? (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading companies...</p>
        </div>
      ) : (
        <ul className="company-list">
          {companies.map(company => (
          <li
  className="company-card"
  key={company.id}
  onClick={() => navigate(`/company/${company.id}`)}
>
  <div className="company-info">
    <div className="company-avatar">{company.name[0]}</div>
    <div className="company-name">{company.name}</div>
    <div className="company-date">{company.date || '10-2-25'}</div>
  </div>

  {/* Prevent navigation on delete click */}
  <div
    className="delete-icon"
    onClick={(e) => {
      e.stopPropagation(); // Stop navigation
      setCompanyToDelete(company.id);
      setShowDeleteConfirm(true);
    }}
  >
    {deletingId === company.id ? '⏳' : '🗑️'}
  </div>
</li>

        ))}
      </ul>
      )}
      <div className="add">
        <AddCompanies  onCompanyAdded={fetchCompanies}  />
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-div">
            <p>Are you sure you want to delete this company and all its data?</p>
            <div className="confirm-buttons">
              <button onClick={handleDelete} disabled={deletingId !== null}>Yes, Delete</button>
              <button onClick={() => { setShowDeleteConfirm(false); setCompanyToDelete(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );


}
