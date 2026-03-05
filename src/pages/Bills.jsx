import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Nav from '../components/Nav';
import ResponsiveNav from '../components/ResponsiveNav';
import PaymentsCompanyList from '../components/PaymentsCompanyList';
import PaymentsDetails from '../components/PaymentsDetails';
import './styles/Home.css';
import './styles/Bills.css';

export default function Bills() {
  const { companyId } = useParams(); // Will be defined if a company is selected
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const handleSelectCompany = (id) => {
    setSelectedCompanyId(id);
  };

  return (
    <div className="home-container bills-container">


      {/* Main content */}
      <div className="content content-bills" style={{ width: '70%'}}>
        {/* Left: Show company list only if no company is selected */}
        {!companyId && !selectedCompanyId && (
          <div className="company-list-container-bills" style={{ }}>
            <PaymentsCompanyList onSelectCompany={handleSelectCompany} />
          </div>
        )}

        {/* Right: Nested route content (company details) or selected details */}
        <div style={{ flex: 2 }}>
          {selectedCompanyId ? (
            <PaymentsDetails companyId={selectedCompanyId} />
          ) : (
            <Outlet />
          )}
        </div>
      </div>

      {/* Responsive nav for mobile */}
      <ResponsiveNav />
    </div>
  );
}
