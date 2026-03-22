import { prisma } from "@/lib/prisma";
import { TestRunStatus } from "@/generated/prisma/enums";
import { launchBrowser } from "./browser";
import { scrapers } from "./scrapers";
import type { PlaywrightConfig, DetectionResult } from "./types";

/**
 * Execute a test run: launch browser with config, visit all detection sites,
 * scrape results, calculate score, and store everything in the database.
 *
 * Each detection site is visited sequentially in the same browser context
 * so the fingerprint stays consistent across all tests.
 */
export async function executeTestRun(testRunId: string): Promise<void> {
  // Mark run as RUNNING
  const testRun = await prisma.testRun.update({
    where: { id: testRunId },
    data: { status: TestRunStatus.RUNNING },
    include: { config: true },
  });

  const config = testRun.config.configJson as PlaywrightConfig;
  const allResults: DetectionResult[] = [];

  try {
    const { browser, context } = await launchBrowser(config);

    try {
      const page = await context.newPage();

      // Run each scraper sequentially
      for (const scraper of scrapers) {
        try {
          console.log(`[TestRun ${testRunId}] Scraping ${scraper.name}...`);
          const siteResults = await scraper.scrape(page);
          allResults.push(...siteResults);
          console.log(
            `[TestRun ${testRunId}] ${scraper.name}: ${siteResults.length} results`
          );
        } catch (error) {
          // If one site fails, record the error but continue to the next
          console.error(
            `[TestRun ${testRunId}] ${scraper.name} failed:`,
            error
          );
          allResults.push({
            testSite: scraper.name,
            testName: "Scraper Error",
            passed: false,
            details:
              error instanceof Error
                ? error.message
                : "Unknown error occurred",
            category: "connectivity",
          });
        }
      }

      await page.close();
    } finally {
      await context.close();
      await browser.close();
    }

    // Store all results in the database
    if (allResults.length > 0) {
      await prisma.testResult.createMany({
        data: allResults.map((r) => ({ ...r, testRunId })),
      });
    }

    // Calculate stealth score: (passed / total) * 100
    // Exclude "connectivity" category errors from score calculation
    const scoreable = allResults.filter((r) => r.category !== "connectivity");
    const passed = scoreable.filter((r) => r.passed).length;
    const score =
      scoreable.length > 0 ? (passed / scoreable.length) * 100 : 0;

    await prisma.testRun.update({
      where: { id: testRunId },
      data: {
        status: TestRunStatus.COMPLETED,
        stealthScore: Math.round(score * 10) / 10, // 1 decimal place
        completedAt: new Date(),
      },
    });

    console.log(
      `[TestRun ${testRunId}] Complete. Score: ${score.toFixed(1)}% (${passed}/${scoreable.length} passed)`
    );
  } catch (error) {
    // Fatal error — browser couldn't launch or something went very wrong
    await prisma.testRun.update({
      where: { id: testRunId },
      data: {
        status: TestRunStatus.FAILED,
        completedAt: new Date(),
      },
    });

    await prisma.testResult.create({
      data: {
        testRunId,
        testSite: "internal",
        testName: "Runner Error",
        passed: false,
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
        category: "connectivity",
      },
    });

    console.error(`[TestRun ${testRunId}] Fatal error:`, error);
  }
}
