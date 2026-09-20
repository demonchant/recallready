import { chromium } from "playwright-core";

const executablePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /open live demo/i }).first().click();
  await page.getByRole("heading", { name: "Overview" }).waitFor({ timeout: 30_000 });

  await page.getByRole("link", { name: /my inventory/i }).click();
  await page.getByRole("link", { name: /add a product/i }).click();
  await page.getByLabel("Product name").fill("E2E Safety Lamp");
  await page.getByLabel("Brand").fill("Test Bright");
  await page.getByLabel(/Model number/).fill("TB L100");
  await page.getByLabel("Retailer").fill("Local test store");
  await page.getByRole("button", { name: /add & start monitoring/i }).click();
  await page.getByText("E2E Safety Lamp", { exact: true }).waitFor({ timeout: 20_000 });

  const productCard = page.locator("article.inventory-card").filter({ hasText: "E2E Safety Lamp" });
  await productCard.getByRole("link", { name: /view product record/i }).click();
  await page.getByLabel("Room").fill("Study");
  await page.getByRole("button", { name: /save product/i }).click();
  await page.getByText("Product record updated.").waitFor({ timeout: 10_000 });

  await page.getByRole("link", { name: /household settings/i }).click();
  await page.getByLabel("Alert email").fill("alex@example.com");
  await page.getByRole("button", { name: /save changes/i }).click();
  await page.getByText("Household settings saved.").waitFor({ timeout: 10_000 });

  await page.getByRole("link", { name: /overview/i }).click();
  await page.getByRole("button", { name: /check sources now/i }).click();
  await page.getByText(/scan complete|source refreshed/i).waitFor({ timeout: 30_000 });

  await page.getByRole("link", { name: /receipt inbox/i }).click();
  await page.getByRole("button", { name: /process this receipt/i }).click();
  await page.getByText(/is now protected|matched a safety notice/i).waitFor({ timeout: 30_000 });
  await page.getByRole("heading", { name: "My inventory" }).waitFor({ timeout: 20_000 });

  const freshPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await freshPage.goto(baseUrl, { waitUntil: "networkidle" });
  await freshPage.getByRole("button", { name: /start my household/i }).click();
  await freshPage.getByRole("heading", { name: "Household settings" }).first().waitFor({ timeout: 30_000 });
  await freshPage.getByRole("link", { name: /my inventory/i }).click();
  await freshPage.getByText("No products found", { exact: true }).waitFor({ timeout: 20_000 });
  await freshPage.close();

  console.log("E2E journeys passed: seeded demo and empty real household onboarding");
} finally {
  await browser.close();
}
