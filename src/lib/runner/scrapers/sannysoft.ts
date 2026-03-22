import type { Page } from "playwright";
import type { DetectionResult } from "../types";

/**
 * Scrape bot.sannysoft.com detection results.
 *
 * This site runs two test suites:
 * 1. "Intoli.com tests + additions" — main tests with stable element IDs
 * 2. "Fingerprint Scanner tests" — fpscanner library by Antoine Vastel
 *
 * Results are in HTML tables. Each result cell has a CSS class of
 * "passed", "failed", or "warn". We scrape both tables.
 */
export async function scrapeSannysoft(page: Page): Promise<DetectionResult[]> {
  await page.goto("https://bot.sannysoft.com", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Wait for the fingerprint scanner tests to finish computing
  // They run async after page load
  await page.waitForTimeout(3000);

  const results = await page.evaluate(() => {
    const output: Array<{
      testSite: string;
      testName: string;
      passed: boolean;
      details: string | null;
      category: string;
    }> = [];

    // ---- Table 1: Main tests (Intoli) ----
    // Each row: td[0] = test name, td[1] = result (has id + class passed/failed)
    const mainTests: Array<{
      id: string;
      name: string;
      category: string;
    }> = [
      {
        id: "user-agent-result",
        name: "User Agent",
        category: "fingerprint",
      },
      { id: "webdriver-result", name: "WebDriver", category: "webdriver" },
      {
        id: "advanced-webdriver-result",
        name: "WebDriver Advanced",
        category: "webdriver",
      },
      { id: "chrome-result", name: "Chrome Object", category: "javascript" },
      {
        id: "permissions-result",
        name: "Permissions API",
        category: "javascript",
      },
      {
        id: "plugins-length-result",
        name: "Plugins Length",
        category: "fingerprint",
      },
      {
        id: "plugins-type-result",
        name: "Plugins Type",
        category: "fingerprint",
      },
      {
        id: "languages-result",
        name: "Languages",
        category: "fingerprint",
      },
      { id: "webgl-vendor", name: "WebGL Vendor", category: "fingerprint" },
      {
        id: "webgl-renderer",
        name: "WebGL Renderer",
        category: "fingerprint",
      },
      {
        id: "broken-image-dimensions",
        name: "Broken Image Dimensions",
        category: "fingerprint",
      },
    ];

    for (const test of mainTests) {
      const el = document.getElementById(test.id);
      if (!el) continue;

      const passed = el.classList.contains("passed");
      const details = el.textContent?.trim() || null;

      output.push({
        testSite: "bot.sannysoft.com",
        testName: test.name,
        passed,
        details,
        category: test.category,
      });
    }

    // ---- Table 2: Fingerprint Scanner tests ----
    // Second table, each row: td[0] = test name, td[1] = ok/FAIL/WARN + class
    const fpTable = document.querySelectorAll("table")[1];
    if (fpTable) {
      const fpRows = fpTable.querySelectorAll("tr");
      fpRows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length < 2) return;

        const testName = cells[0].textContent?.trim() || "";
        const resultCell = cells[1];
        const resultClass = resultCell.className || "";

        // Skip header rows or empty rows
        if (!testName || testName === "Test Name") return;

        // Determine category based on test name prefix
        let category = "javascript";
        if (testName.startsWith("PHANTOM_")) category = "fingerprint";
        if (testName.startsWith("HEADCHR_")) category = "fingerprint";
        if (testName === "SELENIUM_DRIVER") category = "webdriver";
        if (testName === "SEQUENTUM") category = "webdriver";
        if (
          testName === "TRANSPARENT_PIXEL" ||
          testName === "VIDEO_CODECS"
        )
          category = "fingerprint";

        output.push({
          testSite: "bot.sannysoft.com",
          testName: `FP: ${testName}`,
          passed: resultClass.includes("passed"),
          details: resultCell.textContent?.trim().substring(0, 200) || null,
          category,
        });
      });
    }

    return output;
  });

  return results;
}
