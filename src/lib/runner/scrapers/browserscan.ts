import type { Page } from "playwright";
import type { DetectionResult } from "../types";

/**
 * Scrape browserscan.net/bot-detection results.
 *
 * This site uses obfuscated CSS classes (CSS modules), so we can't rely
 * on class selectors. Instead we parse the page text content to extract
 * test names and their Normal/Abnormal status.
 *
 * The page has three sections: Webdriver tests, CDP tests, Navigator dump.
 * We focus on the Webdriver and CDP sections which have clear pass/fail results.
 */
export async function scrapeBrowserscan(
  page: Page
): Promise<DetectionResult[]> {
  await page.goto("https://www.browserscan.net/bot-detection", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Wait for JS-rendered results
  await page.waitForTimeout(4000);

  const results = await page.evaluate(() => {
    const output: Array<{
      testSite: string;
      testName: string;
      passed: boolean;
      details: string | null;
      category: string;
    }> = [];

    // Known test names and their categories
    const webdriverTests = [
      "WebDriver",
      "WebDriver Advance",
      "Selenium",
      "NightmareJS",
      "PhantomJS",
      "Awesomium",
      "Cef",
      "CefSharp",
      "Coaches",
      "FMiner",
      "Born",
      "Phantomas",
      "Rhino",
      "Webdriverio",
      "Headless Chrome",
    ];

    const cdpTests = ["CDP", "Dev Tool"];

    // Strategy: find elements that contain exactly the test name text,
    // then look for a sibling/nearby element with "Normal" or "Abnormal"
    const allElements = document.querySelectorAll("*");

    const findTestResult = (testName: string): boolean | null => {
      for (const el of allElements) {
        // Look for leaf elements containing exactly the test name
        if (
          el.children.length === 0 &&
          el.textContent?.trim() === testName
        ) {
          // Check parent and siblings for status
          const parent = el.parentElement;
          if (!parent) continue;
          const parentText = parent.textContent?.trim() || "";

          // The parent should contain "TestName" + "Normal" or "Abnormal"
          if (parentText.includes("Normal") && !parentText.includes("Abnormal")) {
            return true;
          }
          if (parentText.includes("Abnormal")) {
            return false;
          }

          // Check grandparent
          const grandparent = parent.parentElement;
          if (!grandparent) continue;
          const gpText = grandparent.textContent?.trim() || "";
          if (gpText.includes(testName)) {
            if (gpText.includes("Abnormal")) return false;
            if (gpText.includes("Normal")) return true;
          }
        }
      }
      return null;
    };

    // Scrape webdriver tests
    for (const testName of webdriverTests) {
      const result = findTestResult(testName);
      if (result !== null) {
        output.push({
          testSite: "browserscan.net",
          testName,
          passed: result,
          details: result ? "Normal" : "Abnormal",
          category: "webdriver",
        });
      }
    }

    // Scrape CDP tests
    for (const testName of cdpTests) {
      const result = findTestResult(testName);
      if (result !== null) {
        output.push({
          testSite: "browserscan.net",
          testName,
          passed: result,
          details: result ? "Normal" : "Abnormal",
          category: "webdriver",
        });
      }
    }

    // Also grab the overall result
    const mainText =
      document.querySelector("main")?.innerText || "";
    const overallMatch = mainText.match(
      /Test Results:\s*(Normal|Abnormal)/
    );
    if (overallMatch) {
      output.push({
        testSite: "browserscan.net",
        testName: "Overall Result",
        passed: overallMatch[1] === "Normal",
        details: overallMatch[1],
        category: "webdriver",
      });
    }

    return output;
  });

  return results;
}
