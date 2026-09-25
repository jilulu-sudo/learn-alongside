// 在手机尺寸下打开每个布局变体，量三个答案有没有出现在首屏，并各存一张截图。
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const page_url = new URL('./index.html', import.meta.url).href;
const shots = fileURLToPath(new URL('../docs/images/', import.meta.url));
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const answers = ['total', 'fruit', 'activity'];
const rows = [];

for (const v of ['a', 'b', 'c']) {
  await page.goto(`${page_url}#${v}`);
  await page.reload();
  const seen = {};
  for (const a of answers) {
    const box = await page.locator(`#${v} [data-answer="${a}"]`).boundingBox().catch(() => null);
    seen[a] = box !== null && box.y + box.height <= 844;
  }
  await page.screenshot({ path: `${shots}prototype-${v}.png` });
  rows.push({ variant: v, ...seen, score: answers.filter(a => seen[a]).length });
}
await browser.close();
console.table(rows);
