import type { Page } from "playwright";
import type { DetectionResult } from "../types";

/**
 * Scrape bot-detector.rebrowser.net detection results.
 *
 * This site focuses on Playwright/Puppeteer-specific leaks:
 * - CDP Runtime.Enable detection
 * - Source URL leaks in error stacks from page.evaluate()
 * - page.exposeFunction() creating detectable window properties
 * - Playwright's __pwInitScripts marker
 *
 * Results are in a table with emoji indicators:
 * 🟢 = passed (not detected)
 * 🔴 = failed (detected)
 * ⚪️ = not triggered (requires specific automation action)
 *
 * There's also a #detections-json element with machine-readable results.
 */
export async function scrapeRebrowser(
  page: Page
): Promise<DetectionResult[]> {
  await page.goto("https://bot-detector.rebrowser.net", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Wait for all async tests to complete
  await page.waitForTimeout(4000);

  const results = await page.evaluate(() => {
    const output: Array<{
      testSite: string;
      testName: string;
      passed: boolean;
      details: string | null;
      category: string;
    }> = [];

    const categoryMap: Record<string, string> = {
      dummyFn: "javascript",
      sourceUrlLeak: "webdriver",
      mainWorldExecution: "webdriver",
      runtimeEnableLeak: "webdriver",
      exposeFunctionLeak: "webdriver",
      navigatorWebdriver: "webdriver",
      viewport: "fingerprint",
      pwInitScripts: "webdriver",
      bypassCsp: "javascript",
      useragent: "fingerprint",
    };

    // Parse the table rows
    const rows = document.querySelectorAll("tr");
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 3) return;

      const rawName = cells[0].textContent?.trim() || "";
      const notes = cells[2].textContent?.trim() || "";

      // Extract emoji and test name
      // Emojis: 🟢 (pass), 🔴 (fail), ⚪️ (not triggered)
      const hasGreen = rawName.includes("🟢");
      const hasRed = rawName.includes("🔴");
      const hasWhite = rawName.includes("⚪");

      // Strip emoji to get clean test name
      const testName = rawName
        .replace(/[🟢🔴⚪️\uFE0F]/g, "")
        .trim();

      if (!testName) return;

      // For ⚪️ (not triggered) tests, we treat them as "passed"
      // since they only fail when you actively use the detected feature.
      // This is fair — if you don't use page.exposeFunction(), it can't
      // be detected.
      const passed = hasGreen || hasWhite;

      output.push({
        testSite: "bot-detector.rebrowser.net",
        testName,
        passed,
        details: notes.substring(0, 200),
        category: categoryMap[testName] || "javascript",
      });
    });

    return output;
  });

  return results;
}
