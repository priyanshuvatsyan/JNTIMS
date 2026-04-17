
import React from 'react';
import Nav from '../../components/Nav/Nav';
import './Inventory.css';
import InventoryHeader from './Inventory Components/Inventory Header/InventoryHeader';
import SearchStock from './Inventory Components/SearchStock/SearchStock';
import InventoryFilters from './Inventory Components/InventoryFilters/InventoryFilters';
import AddStock from './Inventory Components/AddStock/AddStock.jsx';

export default function Inventory() {
  const [searchStockTerm, setSearchStockTerm] = React.useState('');
  return (
    <div className="inventory-container">
      <InventoryHeader />
      <SearchStock setSearchStockTerm={setSearchStockTerm} />
      <InventoryFilters />
      <AddStock />
    </div>
  );
}

