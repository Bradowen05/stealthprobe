import { chromium, type Browser, type BrowserContext } from "playwright";
import type { PlaywrightConfig } from "./types";

/**
 * Launch a Chromium browser with the given config and return a context.
 * The caller is responsible for closing the browser when done.
 */
export async function launchBrowser(config: PlaywrightConfig): Promise<{
  browser: Browser;
  context: BrowserContext;
}> {
  const browser = await chromium.launch({
    headless: config.headless ?? false,
    args: config.args ?? [],
  });

  const context = await browser.newContext({
    viewport: config.viewport ?? { width: 1920, height: 1080 },
    userAgent: config.userAgent || undefined,
  });

  // Inject init scripts that run before any page JS
  if (config.initScripts) {
    for (const script of config.initScripts) {
      await context.addInitScript(script);
    }
  }

  return { browser, context };
}
