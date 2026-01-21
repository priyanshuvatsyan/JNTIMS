import { Builder, By, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome.js';

async function automateJNTIMS() {
  // Set up Chrome options
  const options = new Options();
  options.addArguments('--disable-web-security');
  options.addArguments('--disable-features=VizDisplayCompositor');

  // Create the driver
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // Navigate to the app
    await driver.get('http://localhost:5173');

    // Wait for the page to load
    await driver.wait(until.elementLocated(By.className('companies-wrapper')), 10000);

    // Step 1: Create a new company
    console.log('Creating a new company...');
    const addButton = await driver.findElement(By.css('.add button'));
    await addButton.click();

    // Wait for form
    await driver.wait(until.elementLocated(By.css('input[placeholder="Company Name"]')), 5000);

    // Fill company name
    const companyInput = await driver.findElement(By.css('input[placeholder="Company Name"]'));
    await companyInput.sendKeys('Test Company');

    // Submit
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));
    await submitButton.click();

    // Wait for alert and accept
    await driver.wait(until.alertIsPresent(), 5000);
    const alert = await driver.switchTo().alert();
    await alert.accept();

    // Wait for company to appear
    await driver.sleep(2000);

    // Find the new company card and click it
    const companyCards = await driver.findElements(By.className('company-card'));
    const lastCard = companyCards[companyCards.length - 1];
    await lastCard.click();

    // Step 2: Add a new arrival date
    console.log('Adding arrival date...');
    await driver.wait(until.elementLocated(By.className('add-date-button')), 5000);
    const addDateButton = await driver.findElement(By.className('add-date-button'));
    await addDateButton.click();

    // Wait for form
    await driver.wait(until.elementLocated(By.className('add-date-form')), 5000);

    // Fill date
    const dateInput = await driver.findElement(By.css('input[type="date"]'));
    await dateInput.sendKeys('2025-12-13');

    // Fill amount
    const amountInput = await driver.findElement(By.css('input[placeholder="Enter amount"]'));
    await amountInput.sendKeys('1000');

    // Submit
    const dateSubmitButton = await driver.findElement(By.css('.add-date-form button'));
    await dateSubmitButton.click();

    // Wait
    await driver.sleep(2000);

    // Find the new date card and click it
    const dateCards = await driver.findElements(By.className('arrival-date-item'));
    const lastDateCard = dateCards[dateCards.length - 1];
    const dateLink = await lastDateCard.findElement(By.className('date-link'));
    await dateLink.click();

    // Step 3: Add stock items
    console.log('Adding stock items...');
    await driver.wait(until.elementLocated(By.className('add-item-button')), 5000);
    const addItemButton = await driver.findElement(By.className('add-item-button'));
    await addItemButton.click();

    // Wait for modal
    await driver.wait(until.elementLocated(By.className('modal')), 5000);

    // Fill item details
    await driver.findElement(By.css('input[placeholder="Product Name"]')).sendKeys('Test Item');
    await driver.findElement(By.css('input[placeholder="Boxes"]')).sendKeys('10');
    await driver.findElement(By.css('input[placeholder="Units per Box"]')).sendKeys('20');
    await driver.findElement(By.css('input[placeholder="Box Price (without GST)"]')).sendKeys('500');
    await driver.findElement(By.css('input[placeholder="GST %"]')).sendKeys('18');
    await driver.findElement(By.css('input[placeholder="Selling Price per Unit"]')).sendKeys('30');

    // Submit
    const itemSubmitButton = await driver.findElement(By.className('save-product'));
    await itemSubmitButton.click();

    // Wait
    await driver.sleep(2000);

    // Step 4: Make sales (add sold units)
    console.log('Making sales...');
    // Go to sold page
    await driver.get('http://localhost:5173/sold');

    await driver.wait(until.elementLocated(By.className('item-card')), 5000);

    // Find the item and add sold units
    const itemCards = await driver.findElements(By.className('item-card'));
    const lastItemCard = itemCards[itemCards.length - 1];
    const soldInput = await lastItemCard.findElement(By.css('input[placeholder="Units to sell"]'));
    await soldInput.sendKeys('5');

    const addSoldButton = await lastItemCard.findElement(By.css('button'));
    await addSoldButton.click();

    // Wait for save
    await driver.sleep(2000);

    console.log('Automation completed successfully!');

  } catch (error) {
    console.error('Error during automation:', error);
  } finally {
    // Close the browser
    await driver.quit();
  }
}

automateJNTIMS();