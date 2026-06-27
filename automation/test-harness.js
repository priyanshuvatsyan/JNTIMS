import 'dotenv/config';
import { create30DayScenario } from './daywise-scenarios.js';
import {
  addCompany,
  addStockArrivalDate,
  addStock,
  makeSale,
  makePayment,
  getAllStock,
  getCompanies,
  getAllStockArrivalDates,
  getRecentSales
} from '../src/Database/apis.js';

function pickStockItem(stockItems) {
  return stockItems.find((item) => item.remainingQty > 0) || null;
}

export async function runAutomatedScenario(options = {}) {
  const scenario = create30DayScenario(new Date(options.startDate || new Date()));
  const results = [];
  const companyMap = [];
  const stockArrivalMap = [];
  let lastCompanyId = null;

  function findCompanyWithPendingDues() {
    const unpaidCompanyIds = new Set(stockArrivalMap
      .filter((entry) => !entry.isPaid)
      .map((entry) => entry.companyId));
    return companyMap.find((company) => unpaidCompanyIds.has(company.id))?.id || lastCompanyId;
  }

  for (const day of scenario.days) {
    const dayResult = {
      date: day.date,
      actions: [],
      completed: true,
      errors: [],
    };

    for (const action of day.actions) {
      try {
        switch (action.type) {
          case 'createCompany': {
            const company = await addCompany(action.payload);
            companyMap.push(company);
            lastCompanyId = company.id;
            dayResult.actions.push({ type: 'createCompany', company });
            break;
          }
          case 'addStockArrivalDate': {
            const companyId = lastCompanyId || companyMap[0]?.id;
            if (!companyId) throw new Error('No company available for stock arrival');
            const payload = {
              ...action.payload,
              companyId,
            };
            const arrival = await addStockArrivalDate(payload);
            stockArrivalMap.push(arrival);
            dayResult.actions.push({ type: 'addStockArrivalDate', arrival });
            break;
          }
          case 'addStock': {
            const arrival = stockArrivalMap[stockArrivalMap.length - 1];
            if (!arrival) throw new Error('No arrival entry available to attach stock');
            const stock = await addStock({
              ...action.payload,
              companyId: lastCompanyId,
              entryId: arrival.id,
            });
            dayResult.actions.push({ type: 'addStock', stock });
            break;
          }
          case 'makePayment': {
            const paymentCompanyId = findCompanyWithPendingDues();
            if (!paymentCompanyId) throw new Error('No company available for payment');
            const payment = await makePayment({
              ...action.payload,
              companyId: paymentCompanyId,
            });
            dayResult.actions.push({ type: 'makePayment', payment });
            break;
          }
          case 'makeSale': {
            const stocks = await getAllStock();
            const item = pickStockItem(stocks);
            if (!item) throw new Error('No stock item available for sale');
            const sale = await makeSale({
              stockId: item.id,
              quantitySold: action.payload.quantitySold,
              customerName: action.payload.customerName,
            });
            dayResult.actions.push({ type: 'makeSale', sale });
            break;
          }
          default:
            throw new Error(`Unsupported action type: ${action.type}`);
        }
      } catch (error) {
        dayResult.completed = false;
        dayResult.errors.push({ action: action.type, message: error.message });
      }
    }

    results.push(dayResult);
  }

  const actual = {
    companies: await getCompanies(),
    stockArrivalDates: await getAllStockArrivalDates(),
    stock: await getAllStock(),
    recentSales: await getRecentSales(50),
  };

  return { scenario, results, actual };
}
