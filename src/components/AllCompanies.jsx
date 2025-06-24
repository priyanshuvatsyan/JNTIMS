import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AddCompanies from '../components/AddCompanies';
import {  deleteDoc, doc } from 'firebase/firestore';

import './styles/AllCompanies.css';

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
  try {
    await deleteDoc(doc(db, 'companies', companyId));
    fetchCompanies(); // Refresh the list
  } catch (error) {
    console.error('Error deleting company:', error);
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
