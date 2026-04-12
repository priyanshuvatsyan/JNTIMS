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

  return (
    <div className="home-container">
      
      <Crousal />
      <Search setSearchTerm={setSearchTerm} />
      <CompaniesList searchTerm={searchTerm} />
      <AddCompany />
    </div>
  );
}

// naxt steps:
// 1. Create DB apis atleast for home page
// 2. Implement search functionality in home page
// 3. Implement add company functionality with backend integration
// 4. Implement delete company functionality with backend integration
// 5. Implement edit company functionality with backend integration
// 6. put actual data in crousal