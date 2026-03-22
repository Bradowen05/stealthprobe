import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Update Stealth Advanced — targeted webdriver-only override
  const advanced = await prisma.browserConfig.findFirst({
    where: { name: "Stealth Advanced" },
  });

  if (advanced) {
    await prisma.browserConfig.update({
      where: { id: advanced.id },
      data: {
        description:
          "Targeted stealth: only override webdriver flag (avoids worker thread inconsistencies from broad spoofing).",
        configJson: {
          headless: false,
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
    console.log("Updated Stealth Advanced");
  }

  // Update Stealth Basic UA
  const basic = await prisma.browserConfig.findFirst({
    where: { name: "Stealth Basic" },
  });

  if (basic) {
    await prisma.browserConfig.update({
      where: { id: basic.id },
      data: {
        configJson: {
          headless: false,
          args: [
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--no-first-run",
            "--no-default-browser-check",
          ],
          viewport: { width: 1920, height: 1080 },
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        },
      },
    });
    console.log("Updated Stealth Basic UA to Chrome 146");
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
