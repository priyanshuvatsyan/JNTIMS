
import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5173';
const HEADLESS = false; // Set to true to hide browser
const COMPANY_NAME = 'Sanity Test Company';
const ITEM_NAME = 'Sanity Test Item';

// ===== UTILITY FUNCTIONS =====
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function waitAndClick(page, selector, description) {
  try {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector);
    console.log(`✅ Clicked: ${description}`);
    return true;
  } catch (e) {
    console.error(`❌ FAILED to click [${selector}]: ${description}`);
    throw new Error(`Action failed: Could not click ${description}`);
  }
}

async function waitAndType(page, selector, text, description) {
    try {
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.type(selector, text, { delay: 50 });
        console.log(`✅ Typed "${text}" in: ${description}`);
        return true;
      } catch (e) {
        console.error(`❌ FAILED to type in [${selector}]: ${description}`);
        throw new Error(`Action failed: Could not type in ${description}`);
      }
}

// Main Automation
async function runSanityTest() {
  let browser;
  let page;
  console.log('🚀 Starting Sanity Test Automation...');

  try {
    // card containing the company name is a div with class "company-name" inside li.company-card
  const companyCardSelector = `//li[contains(@class, 'company-card') and .//div[contains(@class,'company-name') and text()="${COMPANY_NAME}"]]`;
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--start-maximized'],
      defaultViewport: null,
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultTimeout(20000);

    // Handle alerts automatically
    page.on('dialog', async (dialog) => {
      console.log(`  🔔 Alert: "${dialog.message()}" - Accepting.`);
      await dialog.accept();
    });

    // 1. ADD COMPANY
    console.log("\n--- PHASE 1: ADD COMPANY ---");
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await waitAndClick(page, 'button.add-btn', 'Add Company Button');
    await waitAndType(page, 'input[placeholder="Company Name"]', COMPANY_NAME, 'Company Name Input');
    await waitAndClick(page, 'button[type="submit"]', 'Submit Company Form');
    await sleep(2000); // Wait for navigation/update
    console.log("✅ Company added successfully.");

    // 2. ADD STOCK ARRIVAL DATE
    console.log("\n--- PHASE 2: ADD STOCK ARRIVAL DATE ---");
    // Puppeteer version may not support waitForXPath; use selector prefix
    await page.waitForSelector(`xpath/${companyCardSelector}`, { timeout: 10000 });
    const [companyCard] = await page.$x(companyCardSelector);
    if (!companyCard) {
      throw new Error('Action failed: Could not find the newly created company card on the page.');
    }
    await companyCard.click();
    console.log(`✅ Clicked: Newly Created Company`);
    await sleep(1000);
    await waitAndClick(page, 'button.add-btn', 'Add Arrival Date');
    const today = new Date().toISOString().slice(0, 10);
    await waitAndType(page, 'input[type="date"]', today, 'Arrival Date Input');
    await waitAndType(page, 'input[placeholder="Enter amount"]', '10000', 'Arrival Amount');
    await waitAndClick(page, 'button[type="submit"]', 'Submit Arrival Date');
    await sleep(2000);
    console.log("✅ Stock arrival date added.");

    // 3. ADD STOCK ITEM
    console.log("\n--- PHASE 3: ADD STOCK ITEM ---");
    // click the first arrival-date-item in the list
    await waitAndClick(page, 'li.arrival-date-item, .arrival-date-item', 'Stock Arrival Date');
    await sleep(1000);
    await waitAndClick(page, 'button.add-btn', 'Add Stock Item button');
    await page.waitForSelector('form');
    await waitAndType(page, 'input[placeholder="Product Name"]', ITEM_NAME, 'Item Name');
    await waitAndType(page, 'input[placeholder="Boxes"]', '10', 'Item Boxes');
    await waitAndType(page, 'input[placeholder="Units per Box"]', '12', 'Item Units');
    await waitAndType(page, 'input[placeholder="Box Price (without GST)"]', '120', 'Item Box Price');
    await waitAndType(page, 'input[placeholder="GST %"]', '5', 'Item GST');
    await waitAndType(page, 'input[placeholder="Selling Price per Unit"]', '12', 'Item Selling Price');
    await waitAndClick(page, 'button[type="submit"]', 'Submit Stock Item');
    await sleep(2000);
    console.log("✅ Stock item added.");

    // 4. MAKE A SALE
    console.log("\n--- PHASE 4: MAKE A SALE ---");
    await page.goto(`${BASE_URL}/sold`, { waitUntil: 'networkidle2' });
    const itemCardSelector = `//div[contains(@class, 'item-card') and .//h3[text()='${ITEM_NAME}']]`;
    const itemCard = (await page.$x(itemCardSelector))[0];
    if (!itemCard) throw new Error("Could not find the created item on the sales page.");
    const saleInput = await itemCard.$('input[type="number"]');
    await saleInput.type('5', { delay: 50 });
    await itemCard.$eval('button', el => el.click());
    await sleep(2000);
    console.log("✅ Sale recorded successfully.");

    // 5. DELETE THE COMPANY (and all its data)
    console.log("\n--- PHASE 5: DELETE COMPANY ---");
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    const [companyCardForDelete] = await page.$x(companyCardSelector);
    if (!companyCardForDelete) throw new Error("Could not find the company card to delete.");
    // Click the delete button within the card
    const deleteButton = await companyCardForDelete.$('button.delete-btn');
    if(!deleteButton) throw new Error("Could not find delete button on company card");
    await deleteButton.click();
    await sleep(2000); // Wait for confirmation and deletion
    console.log("✅ Company and all related data deleted successfully.");


    console.log("\n🎉 Sanity Test Completed Successfully! 🎉");

  } catch (error) {
    console.error('\n❌ SANITY TEST FAILED:', error.message);
    if (page) {
        console.log('📸 Taking screenshot of failure...');
        await page.screenshot({ path: 'failure_screenshot.png' });
    }
  } finally {
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed.');
    }
  }
}

runSanityTest();
