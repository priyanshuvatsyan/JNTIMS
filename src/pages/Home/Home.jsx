import React, { useState } from 'react';
import { FaBell } from "react-icons/fa";
import './Home.css';
import Header from './Home Components/Header/Header';
import Crousal from './Home Components/Crousal/Crousal';
import Search from './Home Components/Search/Search';
import CompaniesList from './Home Components/CompaniesList/CompaniesList';
import Nav from '../../components/Nav/Nav';
import AddCompany from './Home Components/AddCompany/AddCompany';

export default function Home() {

  const [searchTerm, setSearchTerm] = useState('');
    const [refreshKey, setRefreshKey] = useState(0); 

  return (
    <div className="home-container">
      
      <Crousal />
      <Search setSearchTerm={setSearchTerm} />
       <CompaniesList searchTerm={searchTerm} refreshKey={refreshKey} /> 
      <AddCompany onSuccess={() => setRefreshKey(k => k + 1)} />
    </div>
  );
}
