
import Nav from '../../components/Nav/Nav';
import QuickSalesHeader from '../../pages/Sales/QuickSalesHeader/QuickSalesHeader';
import SellItems from './SellItems/SellItems';
import RecentSoldItems from './RecentSoldItems/RecentSoldItems'
// import './Sales.css';


export default function Sales() {

  

  return (
    <div className="sales-container">
         <QuickSalesHeader />
          <SellItems />
          <RecentSoldItems />
    </div>
  );
}

