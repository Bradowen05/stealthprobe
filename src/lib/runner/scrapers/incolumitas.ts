import type { Page } from "playwright";
import type { DetectionResult } from "../types";

/**
 * Scrape bot.incolumitas.com detection results.
 *
 * This site has two JSON blocks:
 * 1. #new-tests — modern detection tests (CDP leaks, worker consistency, etc.)
 * 2. #detection-tests — old Intoli + fpscanner tests bundled as JSON
 *
 * Results are "OK", "FAIL", or "WARN" strings in the JSON objects.
 * We also try to capture the behavioral classification score.
 */
export async function scrapeIncolumitas(
  page: Page
): Promise<DetectionResult[]> {
  await page.goto("https://bot.incolumitas.com", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Wait for all async tests to complete — behavioral score needs 15s,
  // but the detection tests complete within ~5s
  await page.waitForTimeout(6000);

  const results = await page.evaluate(() => {
    const output: Array<{
      testSite: string;
      testName: string;
      passed: boolean;
      details: string | null;
      category: string;
    }> = [];

    // ---- New Detection Tests ----
    const newTestsEl = document.getElementById("new-tests");
    if (newTestsEl) {
      try {
        const newTests = JSON.parse(newTestsEl.textContent || "{}");

        const categoryMap: Record<string, string> = {
          puppeteerEvaluationScript: "webdriver",
          webdriverPresent: "webdriver",
          connectionRTT: "behavioural",
          refMatch: "behavioural",
          overrideTest: "javascript",
          overflowTest: "javascript",
          puppeteerExtraStealthUsed: "webdriver",
          inconsistentWebWorkerNavigatorPropery: "fingerprint",
          inconsistentServiceWorkerNavigatorPropery: "fingerprint",
        };

        for (const [testName, result] of Object.entries(newTests)) {
          output.push({
            testSite: "bot.incolumitas.com",
            testName,
            passed: result === "OK",
            details: String(result),
            category: categoryMap[testName] || "javascript",
          });
        }
      } catch {
        // JSON parse failed — page might not have loaded fully
      }
    }

    // ---- Old Detection Tests (intoli + fpscanner) ----
    const oldTestsEl = document.getElementById("detection-tests");
    if (oldTestsEl) {
      try {
        const oldTests = JSON.parse(oldTestsEl.textContent || "{}");

        // Intoli tests
        if (oldTests.intoli) {
          for (const [testName, result] of Object.entries(oldTests.intoli)) {
            output.push({
              testSite: "bot.incolumitas.com",
              testName: `intoli: ${testName}`,
              passed: result === "OK",
              details: String(result),
              category:
                testName.includes("webDriver") || testName.includes("WebDriver")
                  ? "webdriver"
                  : "fingerprint",
            });
          }
        }

        // fpscanner tests
        if (oldTests.fpscanner) {
          for (const [testName, result] of Object.entries(oldTests.fpscanner)) {
            let category = "javascript";
            if (testName.startsWith("PHANTOM_") || testName.startsWith("HEADCHR_"))
              category = "fingerprint";
            if (testName === "SELENIUM_DRIVER" || testName === "WEBDRIVER")
              category = "webdriver";

            output.push({
              testSite: "bot.incolumitas.com",
              testName: `fpscanner: ${testName}`,
              passed: result === "OK",
              details: String(result),
              category,
            });
          }
        }
      } catch {
        // JSON parse failed
      }
    }

    return output;
  });

  return results;
}
