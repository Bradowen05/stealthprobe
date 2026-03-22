# StealthProbe — Detection Site Research

Research conducted 2026-03-22 using Claude in Chrome to visit each site and analyse DOM structure.

---

## 1. bot.sannysoft.com

**URL:** https://bot.sannysoft.com
**What it is:** The classic bot detection test page. Runs two test suites: "Intoli.com tests + additions" and "Fingerprint Scanner tests" (by Antoine Vastel).

### Page Structure

Three HTML tables:
1. **Table 1 — Main tests** (Intoli.com tests + additions)
2. **Table 2 — Fingerprint Scanner tests** (fpscanner library)
3. **Table 3 — Browser details** (informational, not pass/fail)

### Scraping Strategy

**Table 1 — Main Tests:**
Each row has two `<td>` cells. The result cell has an `id` attribute and a CSS class of either `passed` or `failed`.

| Test Name | Result Element ID | Category |
|-----------|------------------|----------|
| User Agent | `#user-agent-result` | fingerprint |
| WebDriver | `#webdriver-result` | webdriver |
| WebDriver Advanced | `#advanced-webdriver-result` | webdriver |
| Chrome Object | `#chrome-result` | javascript |
| Permissions | `#permissions-result` | javascript |
| Plugins Length | `#plugins-length-result` | fingerprint |
| Plugins Type | `#plugins-type-result` | fingerprint |
| Languages | `#languages-result` | fingerprint |
| WebGL Vendor | `#webgl-vendor` | fingerprint |
| WebGL Renderer | `#webgl-renderer` | fingerprint |
| Broken Image | `#broken-image-dimensions` | fingerprint |

**Pass/fail detection:** Check the CSS class on the result element:
- `class="result passed"` → test passed (undetected)
- `class="result failed"` → test failed (detected as bot)

```typescript
// Scraping approach for Table 1
const rows = document.querySelectorAll('table:first-of-type tr');
rows.forEach(row => {
  const cells = row.querySelectorAll('td');
  if (cells.length >= 2) {
    const testName = cells[0].textContent.trim();
    const passed = cells[1].classList.contains('passed');
    const details = cells[1].textContent.trim();
  }
});
```

**Table 2 — Fingerprint Scanner Tests:**
Second table on the page. Result cells have class `passed`, `failed`, or `warn`.

| Test Name | What It Checks | Category |
|-----------|---------------|----------|
| PHANTOM_UA | PhantomJS user agent | fingerprint |
| PHANTOM_PROPERTIES | PhantomJS window properties | javascript |
| PHANTOM_ETSL | Error stack trace length | javascript |
| PHANTOM_LANGUAGE | Language consistency | fingerprint |
| PHANTOM_WEBSOCKET | WebSocket support | javascript |
| MQ_SCREEN | Media query screen match | fingerprint |
| PHANTOM_OVERFLOW | Stack overflow depth | javascript |
| PHANTOM_WINDOW_HEIGHT | Window dimensions consistency | fingerprint |
| HEADCHR_UA | Headless Chrome user agent | fingerprint |
| HEADCHR_CHROME_OBJ | Chrome object presence | javascript |
| HEADCHR_PERMISSIONS | Permission API consistency | javascript |
| HEADCHR_PLUGINS | Plugin count/type | fingerprint |
| HEADCHR_IFRAME | Iframe Chrome object | javascript |
| CHR_DEBUG_TOOLS | Debug tools detection | javascript |
| SELENIUM_DRIVER | Selenium driver properties | webdriver |
| CHR_BATTERY | Battery API presence | javascript |
| CHR_MEMORY | Memory API presence | javascript |
| TRANSPARENT_PIXEL | Canvas transparency check | fingerprint |
| SEQUENTUM | Sequentum automation detection | webdriver |
| VIDEO_CODECS | Video codec support | fingerprint |

```typescript
// Scraping approach for Table 2
const fpTable = document.querySelectorAll('table')[1];
const fpRows = fpTable.querySelectorAll('tr');
fpRows.forEach(row => {
  const cells = row.querySelectorAll('td');
  if (cells.length >= 2) {
    const testName = cells[0].textContent.trim();
    const resultClass = cells[1].className; // 'passed', 'failed', or 'warn'
    const passed = resultClass.includes('passed');
  }
});
```

### How Detection Works (from source code analysis)

1. **WebDriver flag:** Checks `navigator.webdriver` property AND uses lodash `_.has(navigator, "webdriver")`
2. **Advanced WebDriver:** Scans `document` for 35+ known automation keys (e.g., `__webdriver_evaluate`, `$cdc_asdjflasutopfhvcZLmcfl_`, `_Selenium_IDE_Recorder`)
3. **Chrome object:** Checks if `window.chrome` exists
4. **Permissions:** Compares `Notification.permission` vs `navigator.permissions.query()` — if they disagree, it's a bot
5. **Plugins:** Checks `navigator.plugins.length > 0` AND `navigator.plugins instanceof PluginArray`
6. **WebGL:** Gets UNMASKED_VENDOR_WEBGL and UNMASKED_RENDERER_WEBGL, fails if vendor is "Brian Paul" or "Google Inc." or renderer is "Mesa OffScreen" or contains "Swift"
7. **Broken image:** Creates an `<img>` with invalid src — real browsers give `16x16`, headless gives `0x0`

---

## 2. bot.incolumitas.com

**URL:** https://bot.incolumitas.com
**What it is:** More advanced detection by Nikolai Tschacher. Includes behavioural scoring, new CDP-based tests, plus the old Intoli/fpscanner tests. Also has a "Bot Challenge" (form fill + table interaction).

### Page Structure

Results are in two JSON blocks rendered as `<pre>` elements:

1. **`#new-tests`** — New detection tests (JSON object)
2. **`#detection-tests`** — Old tests grouped as `{ intoli: {...}, fpscanner: {...} }`

### Scraping Strategy

Both result sets are JSON — just parse the text content:

```typescript
// New tests
const newTests = JSON.parse(document.getElementById('new-tests').textContent);
// Returns: { puppeteerEvaluationScript: "OK", webdriverPresent: "OK", ... }

// Old tests
const oldTests = JSON.parse(document.getElementById('detection-tests').textContent);
// Returns: { intoli: { userAgent: "OK", ... }, fpscanner: { PHANTOM_UA: "OK", ... } }
```

**Result values:** `"OK"` = passed, `"FAIL"` = detected, `"WARN"` = suspicious

### New Detection Tests

| Test Name | What It Checks | Category |
|-----------|---------------|----------|
| puppeteerEvaluationScript | Puppeteer's evaluation script traces | webdriver |
| webdriverPresent | navigator.webdriver property | webdriver |
| connectionRTT | Network connection round-trip time consistency | behavioural |
| refMatch | Referrer consistency | behavioural |
| overrideTest | Property override detection (Object.defineProperty traces) | javascript |
| overflowTest | Stack overflow depth consistency | javascript |
| puppeteerExtraStealthUsed | Detects puppeteer-extra-stealth specifically | webdriver |
| inconsistentWebWorkerNavigatorPropery | Compares navigator props in main thread vs Web Worker | fingerprint |
| inconsistentServiceWorkerNavigatorPropery | Compares navigator props in main thread vs Service Worker | fingerprint |

### Behavioral Score

- Element with class containing "behavioralClassificationScore"
- Score 0.0 (bot) to 1.0 (human)
- Computed at 1.5s, 4s, 7s, 10s, 15s intervals
- Based on 30+ individual classifiers (mouse movement, typing patterns, scroll behaviour)
- Need to wait at least 15s and interact with page for accurate score

### Additional Fingerprinting

The page also collects and displays:
- IP address info via ipapi.is (datacenter/VPN/proxy detection)
- TCP/IP fingerprint via tcpip.incolumitas.com
- TLS fingerprint
- FingerprintJS visitor ID
- Canvas and WebGL fingerprints
- Web Worker and Service Worker navigator properties

### Key Insight for Scraping

The Web Worker and Service Worker tests are powerful — they compare `navigator` properties between the main thread and worker threads. If you spoof `navigator.webdriver` in the main thread but forget to do it in workers, you'll get caught. This is why simple `Object.defineProperty` overrides aren't enough.

---

## 3. browserscan.net/bot-detection

**URL:** https://www.browserscan.net/bot-detection
**What it is:** Commercial browser fingerprinting service with a bot detection test page. Tests organised into categories.

### Page Structure

- CSS classes are **obfuscated** (CSS modules with random hashes like `_oxrqr1`, `_1ikblmd`)
- No stable element IDs
- Overall result shown as "Test Results: Normal" or "Test Results: Abnormal"
- Results grouped into 4 tabs: Webdriver, User-Agent, CDP, Navigator

### Scraping Strategy

Since classes are obfuscated, we need to scrape by text content patterns:

```typescript
// Get the overall result
const resultText = document.querySelector('main').innerText;
const overallNormal = resultText.includes('Test Results:\nNormal');

// Individual tests appear as "TestName Normal" or "TestName Abnormal"
// Parse by finding test name labels and their adjacent status text
```

### Detection Tests

**Webdriver category:**
| Test | What It Checks |
|------|---------------|
| WebDriver | navigator.webdriver property |
| WebDriver Advance | Advanced automation markers in document |
| Selenium | Selenium-specific window/document properties |
| NightmareJS | Nightmare.js markers |
| PhantomJS | PhantomJS markers |
| Awesomium | Awesomium engine markers |
| Cef | Chromium Embedded Framework markers |
| CefSharp | CefSharp (.NET) markers |
| Coaches | Coachjs markers |
| FMiner | FMiner markers |
| Born | Born automation markers |
| Phantomas | Phantomas markers |
| Rhino | Rhino JS engine markers |
| Webdriverio | Webdriverio markers |
| Headless Chrome | Headless mode detection |

**CDP category:**
| Test | What It Checks |
|------|---------------|
| CDP | Chrome DevTools Protocol usage detection |
| Dev Tool | Developer tools open detection |

**Navigator category:**
- Full dump of all `navigator` properties and their values
- Compares against known automation fingerprints

### Challenge for Scraping

The obfuscated CSS classes mean selectors will break between deployments. Best approach: parse the full text content of the main element and use regex/string matching to extract test names and their Normal/Abnormal status.

---

## 4. bot-detector.rebrowser.net

**URL:** https://bot-detector.rebrowser.net
**What it is:** Open-source detection tests focused specifically on Puppeteer/Playwright leaks. By the rebrowser.net team. Source on GitHub.

### Page Structure

Clean HTML table with three columns: Test name, Time since load, Notes.
Results displayed with emoji indicators:
- 🟢 = passed (not detected)
- 🔴 = failed (detected as bot)
- ⚪️ = not triggered (test requires specific automation action)

A `#detections-json` element contains JSON results.

### Detection Tests

| Test | What It Checks | Category |
|------|---------------|----------|
| dummyFn | Can automation access main world objects via `window.dummyFn()` | javascript |
| sourceUrlLeak | CDP `evaluate` leaks source URL in error stacks | webdriver |
| mainWorldExecution | Code executed in main world vs isolated context | webdriver |
| runtimeEnableLeak | CDP `Runtime.Enable` command detection | webdriver |
| exposeFunctionLeak | `page.exposeFunction()` creates detectable window properties | webdriver |
| navigatorWebdriver | `navigator.webdriver` property | webdriver |
| viewport | Viewport matches default automation library values | fingerprint |
| pwInitScripts | Playwright's `__pwInitScripts` window property | webdriver |
| bypassCsp | Content Security Policy bypass detection | javascript |
| useragent | User agent version matches latest stable Chrome release | fingerprint |

### Scraping Strategy

```typescript
// Option 1: Parse the JSON element
const json = document.getElementById('detections-json').textContent;
const results = JSON.parse(json);

// Option 2: Parse table rows
const rows = document.querySelectorAll('tr');
rows.forEach(row => {
  const cells = row.querySelectorAll('td');
  if (cells.length >= 3) {
    const rawName = cells[0].textContent.trim();
    const icon = rawName.match(/[🟢🔴⚪️]/)?.[0];
    const testName = rawName.replace(/[🟢🔴⚪️]/g, '').trim();
    const passed = icon === '🟢';
    const failed = icon === '🔴';
    const notTriggered = icon === '⚪️';
    const notes = cells[2].textContent.trim();
  }
});
```

### Key Insight

These tests specifically target **Playwright and Puppeteer internals**:
- `Runtime.Enable` is the big one — all automation libs need it, and it's detectable
- `sourceUrlLeak` catches `page.evaluate()` calls that leak `pptr://` or `__playwright_evaluation_script__` in error stacks
- `exposeFunctionLeak` catches `page.exposeFunction()` which adds properties to `window`
- `pwInitScripts` catches Playwright's init script injection mechanism
- Some tests (dummyFn, mainWorldExecution, exposeFunctionLeak) are ⚪️ by default — they only trigger when you actually use those automation features

---

## 5. Stealth Techniques Research

### Detection Vectors (What Sites Check)

1. **navigator.webdriver** — `true` in automated browsers, `undefined` in real ones
2. **CDP Runtime.Enable** — All automation libs call this, anti-bots can detect the side effects
3. **User-Agent** — "HeadlessChrome" in headless mode
4. **WebGL vendor/renderer** — Headless returns "Google Inc." / "Google SwiftShader" instead of real GPU
5. **Plugins** — Headless has 0 plugins, real Chrome has 5
6. **Broken image dimensions** — Headless returns 0x0, real returns 16x16
7. **Chrome object** — `window.chrome` missing or incomplete in headless
8. **Permissions inconsistency** — Notification.permission vs Permissions API disagree
9. **Stack trace leaks** — `page.evaluate()` leaks automation-specific source URLs in error stacks
10. **Worker thread inconsistency** — Spoofed navigator in main thread but not in Web/Service Workers
11. **Viewport defaults** — Playwright defaults to 1280x720, Puppeteer to 800x600
12. **window.__pwInitScripts** — Playwright-specific init script marker
13. **page.exposeFunction** — Creates detectable window properties
14. **Behavioral analysis** — Mouse movement, typing speed, scroll patterns, timing

### Counter-Techniques (Stealth Configs)

**Level 1 — Basic (addresses ~60% of checks):**
```typescript
{
  headless: false,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check'
  ],
  viewport: { width: 1920, height: 1080 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
}
```

**Level 2 — Init Script Spoofing (addresses ~80% of checks):**
```typescript
// Remove webdriver flag
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

// Spoof languages
Object.defineProperty(navigator, 'languages', { get: () => ['en-GB', 'en'] });

// Spoof plugins (Chrome normally has 5 PDF-related plugins)
Object.defineProperty(navigator, 'plugins', { get: () => { /* mock PluginArray */ } });

// Spoof WebGL vendor/renderer
const getParameter = WebGLRenderingContext.prototype.getParameter;
WebGLRenderingContext.prototype.getParameter = function(param) {
  if (param === 37445) return 'Google Inc. (NVIDIA)';
  if (param === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 ...)';
  return getParameter.call(this, param);
};
```

**Level 3 — playwright-extra + stealth plugin:**
```bash
npm install playwright-extra puppeteer-extra-plugin-stealth
```
Uses community-maintained evasion scripts covering webdriver, chrome.runtime, plugins, languages, WebGL, etc.

**Level 4 — Patchright / rebrowser-patches (addresses CDP leaks):**
- Patches Playwright source to avoid `Runtime.Enable` entirely
- Executes JS in isolated ExecutionContexts
- Fixes error stack source URL leaks
- Currently the most comprehensive approach for Cloudflare/DataDome bypass

### What We Should Test

Our StealthProbe configs should cover this spectrum:
1. **Vanilla Playwright** — baseline, fails everything
2. **Headless Playwright** — even worse baseline
3. **Stealth Basic** — args only, no init scripts
4. **Stealth Advanced** — args + init script spoofing
5. **Mobile Emulation** — different fingerprint profile entirely

This lets us measure exactly how much each level of stealth adds.

---

## Sources

- [ScrapeOps — Make Playwright Undetectable](https://scrapeops.io/playwright-web-scraping-playbook/nodejs-playwright-make-playwright-undetectable/)
- [Rebrowser — Runtime.Enable CDP Detection Fix](https://rebrowser.net/blog/how-to-fix-runtime-enable-cdp-detection-of-puppeteer-playwright-and-other-automation-libraries)
- [rebrowser-bot-detector GitHub](https://github.com/rebrowser/rebrowser-bot-detector)
- [Brightdata — Avoiding Bot Detection with Playwright Stealth](https://brightdata.com/blog/how-tos/avoid-bot-detection-with-playwright-stealth)
- [ZenRows — Playwright Stealth](https://www.zenrows.com/blog/playwright-stealth)
- [BrowserStack — Playwright Bot Detection](https://www.browserstack.com/guide/playwright-bot-detection)
