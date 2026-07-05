const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const reportPath = path.resolve('docs/test-results/hu01-filtered-report.html');
  const outPath = path.resolve('docs/test-results/hu01-filtered-report.png');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(pathToFileURL(reportPath).href);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log('Screenshot saved to', outPath);
})();
