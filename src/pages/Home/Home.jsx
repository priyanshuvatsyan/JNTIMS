import React, { useState } from 'react';
import { FaBell } from "react-icons/fa";
import './Home.css';
import Header from './Home Components/Header/Header';
import Crousal from './Home Components/Crousal/Crousal';
import Search from './Home Components/Search/Search';
import CompaniesList from './Home Components/CompaniesList/CompaniesList';

export default function Home() {

  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="home-container">
      <Header />
      <Crousal />
      <Search setSearchTerm={setSearchTerm} />
      <CompaniesList searchTerm={searchTerm} />
    </div>
  );
}

