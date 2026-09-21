import { chromium } from "playwright-core";

const executablePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /view guided demo/i }).click();
  await page.getByRole("heading", { name: "Overview" }).waitFor({ timeout: 30_000 });

  await page.getByRole("link", { name: /my inventory/i }).click();
  await page.getByRole("link", { name: /view product record/i }).first().click();
  await page.getByRole("button", { name: /demo record locked/i }).waitFor({ timeout: 20_000 });
  await page.getByRole("link", { name: /overview/i }).click();
  await page.getByRole("button", { name: /review safety action/i }).click();
  await page.getByRole("button", { name: /demo action locked/i }).first().waitFor({ timeout: 20_000 });

  const freshPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await freshPage.goto(baseUrl, { waitUntil: "networkidle" });
  await freshPage.getByRole("button", { name: /start my household/i }).click();
  await freshPage.getByRole("heading", { name: /welcome/i }).first().waitFor({ timeout: 30_000 });
  await freshPage.getByRole("link", { name: /set up household/i }).click();
  await freshPage.getByLabel("Alert email").fill("alex@example.com");
  await freshPage.getByRole("button", { name: /save changes/i }).click();
  await freshPage.getByText("Household settings saved.").waitFor({ timeout: 10_000 });
  await freshPage.getByRole("link", { name: /my inventory/i }).click();
  await freshPage.getByRole("link", { name: /add a product/i }).click();
  await freshPage.getByLabel("Product name").fill("E2E Safety Lamp");
  await freshPage.getByLabel("Brand").fill("Test Bright");
  await freshPage.getByLabel(/Model number/).fill("TB L100");
  await freshPage.getByRole("button", { name: /add & start monitoring/i }).click();
  await freshPage.getByText("E2E Safety Lamp", { exact: true }).waitFor({ timeout: 20_000 });
  await freshPage.close();

  console.log("E2E journeys passed: seeded demo and empty real household onboarding");
} finally {
  await browser.close();
}
