# JNTIMS — Codebase Documentation

## 1. Project Overview
- Purpose: JNTIMS is a lightweight inventory, sales and billing web app (single-page React app) that uses Firebase Firestore as the backend. It manages companies, stock arrival dates, stock items, sales, and company payments, and provides monthly reporting dashboards.
- Main features:
  - Add / delete companies
  - Add stock arrival dates per company
  - Add stock items (boxes, units, GST, prices)
  - Record sales (units sold) and create global `sales` records
  - Add payments per company and track balances
  - Dashboard charts and monthly reports
  - Automation/E2E script using Puppeteer for large-scale UI testing

## 2. Tech Stack
- Frontend: React (via Vite)
- Router: `react-router-dom`
- Charts: `recharts`
- Icons: `react-icons`, `@fortawesome/react-fontawesome`
- Backend: Firebase (Firestore)
- Dev tools: Vite, ESLint

## 3. How to run (local)
1. Install dependencies:

```powershell
npm install
```

2. Start dev server:

```powershell
npm run dev
```

3. Build:

```powershell
npm run build
```

4. Preview production build:

```powershell
npm run preview
```

Note: Firebase config is in `firebase.js`. Ensure Firestore rules and project config allow the client operations used by the app or replace with your own config.

## 4. Entry points and scripts
- Entry: `index.html` -> `src/main.jsx` renders `<App />` inside `<BrowserRouter>`.
- Routing: `src/App.jsx` defines routes: `/` (Home with nested routes), `/company/:companyId`, `/company/:companyId/date/:dateId`, `/dashboard`, `/bills`, `/sold`.
- npm scripts (in `package.json`): `dev`, `build`, `preview`, `lint`.

## 5. High-level file structure
- `src/`
  - `main.jsx` — app boot
  - `App.jsx` — router and route definitions
  - `firebase.js` — Firebase app + Firestore instance export (`db`)
  - `components/` — UI components (companies, stock, navigation, dashboard)
    - `AddCompanies.jsx`, `AllCompanies.jsx`, `StockArrivalDates.jsx`, `StockItemsOnDate.jsx`, `AllStockItems.jsx`, `PaymentsCompanyList.jsx`, `PaymentsDetails.jsx`, `Nav.jsx`, `ResponsiveNav.jsx`
    - `DashBoard/` — `MonthlyReport.jsx`, `MonthlySales.jsx`, plus styles
  - `pages/` — `Home.jsx`, `Dashboard.jsx`, `Bills.jsx`, `Sold.jsx`
  - `assets/`, `styles/` — CSS files
- `automation.js` — Puppeteer script that simulates large-scale UI interactions
- `package.json`, `vite.config.js`

(See repository file list for full names.)

## 6. Data model (Firestore collections & common document shape)
- Root collections:
  - `companies` (documents per company)
    - fields: `name`, `createdAt`, `totalPayable` (used), `cumulativePaid` (used)
    - subcollections:
      - `arrivalDates` (documents per arrival stock date)
        - fields: `date`, `amount`, `status` (`Active`|`Sold`), `timestamp`
        - subcollection: `stockItems` (or `items` in some components)
          - fields per item: `name`, `boxes`, `unitsPerBox`, `units` (total), `sold`, `gst`, `boxPrice`, `boxPriceWithGst`, `totalCostWithoutGst`, `totalCostWithGst`, `perUnitWithoutGst`, `perUnitWithGst`, `sellingPrice`, `timestamp`, `totalRevenue`, `totalProfit`, `sales` (array)
      - `payments` (per-company payments)
        - fields: `checkNumber`, `amountPaid`, `timestamp`
- Global collections:
  - `sales` — global sales entries created when items are sold
    - fields: `companyId`, `itemId`, `itemName`, `unitsSold`, `revenue`, `profit`, `date`, `timestamp`
  - `totals` (used by `AllStockItems` for aggregate numbers), e.g. doc `totals/global` fields `totalRevenue`, `totalProfit`

Important: some components reference slightly different subcollection names (`stockItems` vs `items`). Code handles `stockItems` widely; `StockArrivalDates` reads `items` in one place — ensure consistency if modifying.

## 7. Component responsibilities (brief)
- `AddCompanies.jsx`: modal form to create a company (`companies` collection).
- `AllCompanies.jsx`: lists all companies, provides delete (deep delete subcollections via helper `deleteCollection`) and navigation to company page.
- `StockArrivalDates.jsx`: lists arrival dates for a selected company, add/delete dates, mark Sold/Active, calculates amount by summing items under a date, increments company payable when adding dates.
- `StockItemsOnDate.jsx`: list and manage items for a specific arrival date: add item (calculates GST, per-unit), save incremental sold units (updates `sold`, adds to `sales` collection), deletes item, totals and profit calc.
- `AllStockItems.jsx`: aggregates items across all companies/dates (for Sold page), allows recording sold units that update both item documents and global `totals/global` doc.
- `PaymentsCompanyList.jsx`: lists companies for Bills flow.
- `PaymentsDetails.jsx`: handles payments for a company, add/delete/restore payments, maintains `cumulativePaid` on company doc and calculates remaining balance.
- `Nav.jsx` / `ResponsiveNav.jsx`: sidebar and responsive bottom nav links.
- `DashBoard/MonthlyReport.jsx`: computes monthly revenue/profit from global `sales` collection, stock availability, and shows stock breakdown.
- `DashBoard/MonthlySales.jsx`: builds charts using `recharts` from `sales` data; month selection slider and comparison cards.

## 8. Key flows (user stories + code mapping)
- Add Company: `AddCompanies` → writes to `companies` collection; `AllCompanies` refreshes list.
- Add Arrival Date: `StockArrivalDates` → writes to `companies/{companyId}/arrivalDates`; also increments `companies/{companyId}.totalPayable`.
- Add Stock Item: `StockItemsOnDate` → computes GST and per-unit fields, writes to `companies/{companyId}/arrivalDates/{dateId}/stockItems`.
- Record Sale (per item): `StockItemsOnDate` / `AllStockItems` → updates item `sold`, appends `sales` record to global `sales` collection, updates `totals/global` (in `AllStockItems` flow), and sets arrival date `status` to `Sold` when all items sold.
- Add Payment: `PaymentsDetails` → writes to `companies/{companyId}/payments` and updates `companies/{companyId}.cumulativePaid`.
- Dashboard: `DashBoard/*` reads `sales` global collection and `companies` subcollections to compute monthly aggregates and visualizations.

## 9. Automation & E2E (`automation.js`)
- Uses Puppeteer to simulate UI operations at scale: add many companies, many arrival dates, many stock items, perform sales, and add payments.
- Useful for load and integration testing. It interacts purely with the UI (no direct DB writes).

## 10. Notable implementation details & caveats
- Firestore paths: some components use `items` subcollection name vs `stockItems` — this inconsistency can cause missing reads/writes. Recommended: unify to `stockItems` or `items` and update all code.
- `AllCompanies` includes a recursive `deleteCollection` helper — be careful: deleting Firestore subcollections in production is destructive.
- `StockArrivalDates` calculates `calculatedAmount` by summing `items` (note name mismatch) price fields.
- `AllStockItems` updates a global `totals/global` doc when recording sales; ensure `totals/global` exists and has numeric fields.
- No authentication is implemented; Firestore rules must permit client access or you should add Auth and rule restrictions.

## 11. How to extend / common dev tasks
- To add a new component: place under `src/components`, add CSS in `src/components/styles`, import where needed.
- To unify subcollection names: search for `stockItems` and `items` and choose one canonical name; update `StockArrivalDates`, `StockItemsOnDate`, `AllStockItems`, `automation.js` accordingly.
- To add authentication: implement Firebase Auth in `firebase.js` and protect routes; update Firestore rules.

## 12. Tests & next steps

## 14. Expanded Feature and Functionality List (User-facing)
 - Companies
   - Add, view, and deep-delete companies (all associated data)
   - Company page shows arrival dates and payments
 - Inventory & Stock
   - Add arrival dates (date, declared amount)
   - Add stock items per arrival (boxes, units/box, GST, box price, selling price)
   - Live price preview when adding items (per-unit with/without GST)
   - View stock items by date and full item breakdown
 - Sales & Billing
   - Record sales per item (incremental sold units)
   - Global `sales` collection for analytics and audit
   - Auto-mark arrival date `Sold` when all items are sold
   - Add payments per company and restore/delete payments
 - Reporting & Dashboards
   - Monthly revenue and profit aggregation from `sales`
   - Stock availability, varieties, and per-company breakdown
   - Charts: line charts, comparison cards, month slider
 - Automation & Testing
   - `automation.js` Puppeteer script to simulate large-scale UI operations

## 15. Expanded Technical Details

 - Architecture overview:
   - SPA client (React) communicates directly with Firebase Firestore (no backend server).
   - Collections: `companies` -> `arrivalDates` -> `stockItems` (subcollections), plus root `sales` and `totals`.

 - Data flow examples:
   - Adding an item → computed pricing fields (GST, per-unit) -> written to `companies/{cid}/arrivalDates/{did}/stockItems`.
   - Selling units → update `sold` on the item, write a `sales` record to root, update aggregates (`totals/global`) optionally.
   - Adding arrival date → writes date doc and increments `companies/{cid}.totalPayable`.

 - Naming & consistency note:
   - Some files reference `items` vs `stockItems`. This is a functional risk—search and standardize the subcollection name to avoid missing reads/writes.

 - Key computed fields stored on items (so UI doesn't recompute for every render):
   - `boxPriceWithGst`, `perUnitWithGst`, `perUnitWithoutGst`, `totalCostWithGst`, `totalCostWithoutGst`, `units`, `sold`, `sellingPrice`.

 - Aggregation strategy:
   - The app relies on client-side reads of the `sales` collection for monthly aggregation. For larger datasets, consider server-side aggregation (Cloud Functions to maintain monthly summaries) or Firestore aggregation documents.

## 16. Non-Technical & Product Considerations

 - User roles & permissions (not yet implemented):
   - Admin: full CRUD on companies, items, payments
   - Operator: add stock, record sales
   - Viewer: dashboard-only
   - Recommendation: implement Firebase Auth + role claims, then enforce via Firestore rules.

 - UX recommendations:
   - Search/filter/sort on company and item lists for large datasets
   - Pagination or infinite scroll for lists (AllStockItems / sales list)
   - Confirmation modals for destructive actions (deep delete)

 - Business rules & validations:
   - Prevent over-selling: UI enforces remaining units check, but add server-side checks (Cloud Function) for atomicity if multi-client usage increases.
   - Payment validation: ensure payment amount ≤ remaining balance.

## 17. Security & Firestore Rules (suggested)
 - Minimum recommended rules:
   - Require authentication for write operations
   - Allow reads for dashboards if public; otherwise gate them
   - Restrict company-level writes to owners/admins

Sample (conceptual) rules snippet:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /companies/{companyId} {
      allow read: if true; // or auth check
      allow write: if request.auth != null && isAdmin(request.auth.uid);
      match /{sub=**} {
        allow read: if true;
        allow write: if request.auth != null && isAdmin(request.auth.uid);
      }
    }
    match /sales/{saleId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 18. Performance & Scaling Notes
 - For large datasets (thousands of items/sales):
   - Move heavy aggregation off the client to Cloud Functions that maintain summary documents (e.g., `monthlyStats/{YYYY-MM}`).
   - Add indexes for queries on `sales.date`, `companies` and `arrivalDates.timestamp`.
   - Avoid deep nested reads in the UI; fetch paginated batches.

## 19. Testing, QA & Automation
 - Unit tests: add Jest + React Testing Library for calculation functions and components with logic (`StockItemsOnDate` math functions).
 - Integration tests: Cypress or Playwright for UI flows (add company → add date → add item → sell → payment).
 - E2E: `automation.js` demonstrates high-scale testing with Puppeteer; convert critical flows to smaller CI-friendly E2E tests.

## 20. Developer Onboarding Checklist
 - Prereqs: Node.js & npm
 - Steps:
   1. `npm install`
   2. Copy your Firebase config into `firebase.js` (or use environment variables)
   3. `npm run dev`
   4. Use the UI to create seed data or run `node automation.js` for scale testing (ensure Puppeteer deps installed)

## 21. Roadmap & Suggested Enhancements
 - Short term:
   - Standardize subcollection names (`stockItems`)
   - Add authentication & Firestore rules
   - Add pagination/search on large lists
 - Medium term:
   - Server-side aggregations (Cloud Functions) for monthly stats
   - Role-based UI & audit logs
   - Improve UI responsiveness + mobile layout polish
 - Long term:
   - Multi-warehouse support, SKU management, supplier integrations
   - Export reports (CSV/PDF) and scheduled email reports

## 22. Glossary
 - SKU: Stock Keeping Unit
 - Arrival Date: Date when stock arrived for a company
 - Units: total units = `boxes * unitsPerBox`

---

If you want, I can now:
 - produce a shorter `README.md` derived from this document,
 - generate a PDF or HTML of this `DOCUMENTATION.md`, or
 - run a consistency pass to unify `items` vs `stockItems` naming across the codebase and submit a follow-up patch.
- Firebase config: `firebase.js`
- Components: `src/components/` (see list above)
- Pages: `src/pages/`
- Automation script: `automation.js`

---
If you'd like, I can:
- produce a shorter executive README variant, or
- convert this `DOCUMENTATION.md` into a PDF/HTML, or
- run a consistency pass to unify `items` vs `stockItems` naming.

