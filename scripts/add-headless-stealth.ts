import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.browserConfig.findFirst({
    where: { name: "Headless Stealth" },
  });

  if (existing) {
    console.log("Headless Stealth already exists — skipping");
    return;
  }

  await prisma.browserConfig.create({
    data: {
      name: "Headless Stealth",
      description:
        "Headless mode with stealth overrides — tests whether webdriver removal + updated UA can rescue headless detection scores.",
      configJson: {
        headless: true,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--disable-dev-shm-usage",
          "--no-first-run",
          "--no-default-browser-check",
        ],
        viewport: { width: 1920, height: 1080 },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        initScripts: [
          "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });",
        ],
      },
    },
  });

  console.log("Created Headless Stealth config");
}

main()
  .catch(console.error)
  .finally(() => process.exit());
