import { format, addDays } from 'date-fns';

export function create30DayScenario(startDate = new Date()) {
  const days = [];
  let companyCounter = 0;
  let stockCounter = 0;

  for (let i = 0; i < 30; i += 1) {
    const date = addDays(startDate, i);
    const dayNumber = i + 1;
    const actions = [];

    // Create a new company every day
    companyCounter += 1;
    const companyName = `Automation Company ${companyCounter}`;
    const phone = `9000000${String(companyCounter).padStart(3, '0')}`;
    actions.push({
      type: 'createCompany',
      payload: { name: companyName, phone },
    });

    // Add stock on day 1 and then every 4 days so daily sales can use available inventory
    if (dayNumber === 1 || dayNumber % 4 === 1) {
      stockCounter += 1;
      actions.push({
        type: 'addStockArrivalDate',
        payload: {
          amount: 15000 + stockCounter * 1000,
          arrivalDate: format(date, 'yyyy-MM-dd'),
        },
      });
      actions.push({
        type: 'addStock',
        payload: {
          productName: `Test Item ${stockCounter}`,
          boxes: 5,
          unitsPerBox: 2,
          boxPriceWithoutGst: 1000,
          gst: 18,
          sellingPrice: 700,
        },
      });
    }

    // Make payment every 6 days for a previously created company if available
    if (dayNumber % 6 === 0) {
      actions.push({
        type: 'makePayment',
        payload: {
          amount: 5000 + dayNumber * 10,
          paymentDate: format(date, 'yyyy-MM-dd'),
          paymentMode: 'cash',
          note: `Automated payment day ${dayNumber}`,
        },
      });
    }

    // Make at least one sale every day using any existing stock item
    actions.push({
      type: 'makeSale',
      payload: {
        quantitySold: 1 + (dayNumber % 3),
        customerName: `Customer ${dayNumber}`,
      },
    });

    days.push({
      dayNumber,
      date: format(date, 'yyyy-MM-dd'),
      actions,
    });
  }

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    days,
  };
}
