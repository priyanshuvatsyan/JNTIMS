import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import './styles/PaymentsCompanyList.css'; 

export default function PaymentsCompanyList() {
  const [companies, setCompanies] = useState([]);
  const location = useLocation();

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
    <div className="company-list-wrapper">
      <h2 className="company-list-heading">Choose Company for Payments</h2>
      <ul className="company-list">
        {companies.map(company => (
          <li key={company.id} className="company-card">
            <Link to={`${company.id}`} className="company-link">
              {company.name || 'Unnamed Company'}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
