// src/pages/PaymentsCompanyList.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../firebase'; // Adjust path if needed

export default function PaymentsCompanyList() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const ref = collection(db, 'companies');
        const snapshot = await getDocs(ref);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompanies(data);
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Choose Company for Payments</h2>
      <ul>
        {companies.map(company => (
          <li key={company.id}>
            <Link to={`/payments/${company.id}`} style={{ fontSize: '1.2rem' }}>
              {company.name || 'Unnamed Company'}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
