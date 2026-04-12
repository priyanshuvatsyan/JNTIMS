
import React from 'react';
import Nav from '../../components/Nav/Nav';
import './Inventory.css';
import InventoryHeader from './Inventory Components/Inventory Header/InventoryHeader';
import SearchStock from './Inventory Components/SearchStock/SearchStock';

export default function Inventory() {
  const [searchStockTerm, setSearchStockTerm] = React.useState('');
  return (
    <div className="inventory-container">
      <InventoryHeader />
      <SearchStock setSearchStockTerm={setSearchStockTerm} />
    </div>
  );
}

