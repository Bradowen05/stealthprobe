// Types for the Playwright test runner

export interface PlaywrightConfig {
  headless?: boolean;
  args?: string[];
  viewport?: { width: number; height: number };
  userAgent?: string;
  // Init scripts run inside the browser before any page JavaScript
  // Used for spoofing navigator properties, WebGL, etc.
  initScripts?: string[];
}

export interface DetectionResult {
  testSite: string;
  testName: string;
  passed: boolean;
  details: string | null;
  category: string;
}
