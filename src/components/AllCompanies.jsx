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


  const fetchCompanies = async () => {
    try {
      const snapshoty = await getDocs(collection(db, 'companies'));
      const data = snapshoty.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies: ", error);
    }
  }
  const handleDelete = async (companyId) => {
    console.log(`Starting delete for companyId: ${companyId}`);
    const companyToDelete = companies.find(c => c.id === companyId);
    console.log(`Found company to delete:`, companyToDelete);
    // Optimistically remove from UI
    setCompanies(prev => prev.filter(c => c.id !== companyId));
    try {
      // Delete subcollections first
      const paymentsRef = collection(db, 'companies', companyId, 'payments');
      console.log(`Deleting payments for company: ${companyId}`);
      await deleteCollection(paymentsRef);

      const stockArrivalDatesRef = collection(db, 'companies', companyId, 'arrivalDates');
      console.log(`Deleting arrivalDates for company: ${companyId}`);
      await deleteCollection(stockArrivalDatesRef);

      // Now delete the company document
      console.log(`Deleting company document: companies/${companyId}`);
      await deleteDoc(doc(db, 'companies', companyId));
      console.log('Company and all associated data deleted successfully from DB');
    } catch (error) {
      console.error('Error deleting company and data from DB:', error);
      // Revert the UI change if DB delete fails
      setCompanies(prev => [...prev, companyToDelete]);
      alert('Failed to delete company and associated data from database. Please try again.');
    }
  };


  useEffect(() => {
    fetchCompanies();
  }, []);


  return (
    <div className="companies-wrapper">
      <h3>All Companies</h3>
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
      handleDelete(company.id);
    }}
  >
    🗑️
  </div>
</li>

        ))}
      </ul>
      <div className="add">
        <AddCompanies  onCompanyAdded={fetchCompanies}  />
      </div>
    </div>
  );


}
