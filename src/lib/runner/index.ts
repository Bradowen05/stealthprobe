import { prisma } from "@/lib/prisma";
import { TestRunStatus } from "@/generated/prisma/enums";
import { launchBrowser } from "./browser";
import type { PlaywrightConfig, DetectionResult } from "./types";

/**
 * Execute a test run: launch browser with config, visit detection sites,
 * scrape results, calculate score, and store everything in the database.
 *
 * This is the core orchestrator — individual site scrapers will be added
 * in Phase 3 after we research each site's DOM structure.
 */
export async function executeTestRun(testRunId: string): Promise<void> {
  // Mark run as RUNNING
  const testRun = await prisma.testRun.update({
    where: { id: testRunId },
    data: { status: TestRunStatus.RUNNING },
    include: { config: true },
  });

  const config = testRun.config.configJson as PlaywrightConfig;
  let results: DetectionResult[] = [];

  try {
    const { browser, context } = await launchBrowser(config);

    try {
      // Phase 3 will add site-specific scrapers here.
      // For now, run a basic connectivity test to verify the runner works.
      const page = await context.newPage();
      await page.goto("about:blank");

      results.push({
        testSite: "internal",
        testName: "Browser Launch",
        passed: true,
        details: `Browser launched successfully. Headless: ${config.headless ?? false}`,
        category: "connectivity",
      });

      await page.close();
    } finally {
      await context.close();
      await browser.close();
    }

    // Store results
    if (results.length > 0) {
      await prisma.testResult.createMany({
        data: results.map((r) => ({ ...r, testRunId })),
      });
    }

    // Calculate stealth score (passed / total * 100)
    const passed = results.filter((r) => r.passed).length;
    const score = results.length > 0 ? (passed / results.length) * 100 : 0;

    await prisma.testRun.update({
      where: { id: testRunId },
      data: {
        status: TestRunStatus.COMPLETED,
        stealthScore: score,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    // Mark as failed and store the error
    await prisma.testRun.update({
      where: { id: testRunId },
      data: {
        status: TestRunStatus.FAILED,
        completedAt: new Date(),
      },
    });

    // Store error as a failed result
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
  }
}
