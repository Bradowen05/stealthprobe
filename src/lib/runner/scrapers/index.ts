import type { Page } from "playwright";
import type { DetectionResult } from "../types";
import { scrapeSannysoft } from "./sannysoft";
import { scrapeIncolumitas } from "./incolumitas";
import { scrapeBrowserscan } from "./browserscan";
import { scrapeRebrowser } from "./rebrowser";

export interface SiteScraper {
  name: string;
  scrape: (page: Page) => Promise<DetectionResult[]>;
}

/**
 * All detection site scrapers in execution order.
 * Each scraper navigates to its site, waits for results, and returns
 * structured DetectionResult[] that get stored in the database.
 */
export const scrapers: SiteScraper[] = [
  { name: "bot.sannysoft.com", scrape: scrapeSannysoft },
  { name: "bot.incolumitas.com", scrape: scrapeIncolumitas },
  { name: "browserscan.net", scrape: scrapeBrowserscan },
  { name: "bot-detector.rebrowser.net", scrape: scrapeRebrowser },
];
