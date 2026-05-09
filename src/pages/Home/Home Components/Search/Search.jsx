import React from 'react';
import { FiBell } from "react-icons/fi";
import './Search.css';

export default function Search({setSearchTerm}) {
  return (
    <div className="search">
        <input type="search" name="search" id="" 
        placeholder='Search Companies' 
        onChange={(e) => setSearchTerm(e.target.value)} />
    </div>
  );
}