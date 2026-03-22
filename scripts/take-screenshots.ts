import { chromium } from "playwright";
import path from "path";

const SCREENSHOTS_DIR = path.join(__dirname, "..", "screenshots");
const BASE_URL = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  // 1. Dashboard — wait for the table data to load
  console.log("Capturing dashboard...");
  const dashboard = await context.newPage();
  await dashboard.goto(BASE_URL, { waitUntil: "networkidle" });
  await dashboard.waitForSelector("text=COMPLETED", { timeout: 10000 });
  await dashboard.waitForTimeout(500);
  await dashboard.screenshot({
    path: path.join(SCREENSHOTS_DIR, "dashboard.png"),
  });
  await dashboard.close();

  // 2. Comparison — click 3 cards and capture chart + table
  console.log("Capturing comparison...");
  const compare = await context.newPage();
  await compare.goto(BASE_URL + "/compare", { waitUntil: "networkidle" });
  await compare.waitForSelector("text=Select up to 3", { timeout: 10000 });
  await compare.waitForTimeout(500);

  // Click 3 run selector cards
  const cards = await compare.locator("main button").all();
  for (let i = 0; i < Math.min(3, cards.length); i++) {
    await cards[i].click();
    await compare.waitForTimeout(2000);
  }

  // Wait for score cards to appear
  await compare.waitForSelector("text=stealth score", { timeout: 10000 });
  await compare.waitForTimeout(500);
  await compare.screenshot({
    path: path.join(SCREENSHOTS_DIR, "comparison-scores.png"),
  });

  // Scroll to chart
  await compare.evaluate(() => window.scrollBy(0, 350));
  await compare.waitForTimeout(1000);
  await compare.screenshot({
    path: path.join(SCREENSHOTS_DIR, "comparison-chart.png"),
  });

  // Scroll to PASS/FAIL table
  await compare.evaluate(() => window.scrollBy(0, 500));
  await compare.waitForTimeout(500);
  await compare.screenshot({
    path: path.join(SCREENSHOTS_DIR, "comparison-table.png"),
  });
  await compare.close();

  // 3. Run detail page
  console.log("Capturing run detail...");
  const detail = await context.newPage();
  await detail.goto(BASE_URL + "/runs", { waitUntil: "networkidle" });
  await detail.waitForSelector("text=COMPLETED", { timeout: 10000 });

  // Click the first run link
  const firstLink = detail.locator("a[href*='/runs/']").first();
  await firstLink.click();
  await detail.waitForURL("**/runs/**");
  await detail.waitForSelector("text=stealth", { timeout: 10000 });
  await detail.waitForTimeout(500);
  await detail.screenshot({
    path: path.join(SCREENSHOTS_DIR, "run-detail.png"),
  });
  await detail.close();

  // 4. Runs list
  console.log("Capturing runs list...");
  const runsList = await context.newPage();
  await runsList.goto(BASE_URL + "/runs", { waitUntil: "networkidle" });
  await runsList.waitForSelector("text=COMPLETED", { timeout: 10000 });
  await runsList.waitForTimeout(500);
  await runsList.screenshot({
    path: path.join(SCREENSHOTS_DIR, "runs-list.png"),
  });
  await runsList.close();

  await context.close();
  await browser.close();
  console.log("All screenshots saved to screenshots/");
}

main().catch(console.error);
