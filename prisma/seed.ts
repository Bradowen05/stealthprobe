import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const configs = [
  {
    name: "Vanilla Playwright",
    description:
      "Default Playwright chromium launch — no modifications. The baseline for comparison.",
    configJson: {
      headless: false,
      args: [],
      viewport: { width: 1920, height: 1080 },
    },
  },
  {
    name: "Headless Playwright",
    description:
      "Playwright with headless mode. Faster but easier for sites to detect.",
    configJson: {
      headless: true,
      args: [],
      viewport: { width: 1920, height: 1080 },
    },
  },
  {
    name: "Stealth Basic",
    description:
      "Common stealth args: disable AutomationControlled, realistic viewport and user agent.",
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
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  },
  {
    name: "Stealth Advanced",
    description:
      "Everything in Basic plus navigator property spoofing, WebGL overrides, and plugin emulation.",
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
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      initScripts: [
        // Remove webdriver flag
        "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });",
        // Spoof languages
        "Object.defineProperty(navigator, 'languages', { get: () => ['en-GB', 'en'] });",
        // Spoof platform
        "Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });",
        // Spoof plugins (Chrome normally has 5)
        `Object.defineProperty(navigator, 'plugins', { get: () => {
          const plugins = [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
            { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
          ];
          plugins.length = 3;
          return plugins;
        }});`,
        // Spoof WebGL vendor/renderer
        `(() => {
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function(param) {
            if (param === 37445) return 'Google Inc. (NVIDIA)';
            if (param === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Direct3D11 vs_5_0 ps_5_0)';
            return getParameter.call(this, param);
          };
        })();`,
      ],
    },
  },
  {
    name: "Mobile Emulation",
    description: "Playwright iPhone 14 device emulation.",
    configJson: {
      headless: false,
      args: [],
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    },
  },
];

async function main() {
  console.log("Seeding browser configurations...");

  for (const config of configs) {
    const existing = await prisma.browserConfig.findFirst({
      where: { name: config.name },
    });

    if (existing) {
      console.log(`  Skipping "${config.name}" — already exists`);
      continue;
    }

    await prisma.browserConfig.create({ data: config });
    console.log(`  Created "${config.name}"`);
  }

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => process.exit());
