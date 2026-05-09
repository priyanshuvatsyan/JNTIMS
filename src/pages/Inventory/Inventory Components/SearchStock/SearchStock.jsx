import React from 'react';
import { FiBell } from "react-icons/fi";
import './SearchStock.css';

export default function SearchStock({setSearchStockTerm}) {
  return (
    <div className="SearchStock">
        <input type="search" name="search" id="" 
        placeholder='Search Companies' 
        onChange={(e) => setSearchStockTerm(e.target.value)} />
    </div>
  );
}