
const { test, expect, _chromium } = require('@playwright/test');
const path = require('path');

test.describe('Gemini Web Companion E2E', () => {
  let browser;
  let page;
  let extensionId;

  test.beforeAll(async () => {
    const pathToExtension = path.join(__dirname);
    const context = await _chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    browser = context;

    const serviceWorker = await context.waitForEvent('serviceworker');
    extensionId = serviceWorker.url().split('/')[2];
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should allow creating and saving a new prompt', async () => {
    await page.click('#new-prompt');
    await page.fill('#prompt-name', 'My Test Prompt');
    await page.fill('#prompt-text', 'This is the text of the prompt.');
    await page.click('#save-prompt');

    const promptOption = await page.locator('select#prompt-select option');
    await expect(promptOption).toHaveText('My Test Prompt');
    await expect(promptOption).toHaveAttribute('value', 'This is the text of the prompt.');
  });
});
