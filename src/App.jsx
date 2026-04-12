import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Inventory from './pages/Inventory/Inventory';
import Sales from './pages/Sales/Sales';
import Analytics from './pages/Analytics/Analytics';
import Bills from './pages/Bills/Bills';  
import Nav from './components/Nav/Nav';
import Header from './pages/Home/Home Components/Header/Header';

function App() {
  return (
    <>
    <Header />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path='/inventory' element={<Inventory/>} />
      <Route path='/sales' element={<Sales/>} />
      <Route path='/analytics' element={<Analytics/>} />
      <Route path='/bills' element={<Bills/>} />
      
     
    </Routes>
    <Nav />
    </>
  );
}

export default App;
