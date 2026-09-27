// 在真浏览器里放一遍构建产物：能播、每一拍都能画、同一时刻画面相同、地图面板能剪枝、URL 跟着变。
// 用法：npm run build && npm run smoke        加 --shots 顺便给每一拍截一张图到 e2e/out/
import { chromium } from 'playwright';
import { preview } from 'vite';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = fileURLToPath(new URL('./out/', import.meta.url));
const shots = process.argv.includes('--shots');

const server = await preview({ root, preview: { port: 4173, strictPort: false, host: '127.0.0.1' }, logLevel: 'silent' });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const errors = [];
const check = async (name, fn) => {
  await fn();
  console.log(`PASS ${name}`);
};

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN' });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  const film = fn => page.evaluate(fn);
  const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const seek = async t => {
    await page.evaluate(t => window.__film.seek(t), t);
    await settle();
  };

  await page.goto(url);
  await page.locator('.stage').waitFor();

  await check('点“开始放映”，时间开始走，字幕出现', async () => {
    await page.getByRole('button', { name: '▶ 开始放映' }).click();
    await page.waitForTimeout(1500);
    assert.ok((await film(() => window.__film.state.t)) > 0.8);
    assert.ok((await page.getByTestId('caption').innerText()).length > 5);
    await page.keyboard.press(' ');
    assert.equal(await film(() => window.__film.state.playing), false);
  });

  const beats = await film(() => window.__film.timeline.entries.flatMap(e => e.beats.map(b => ({ scene: e.id, beat: b.id, t: (b.start + b.end) / 2 }))));

  await check(`完整版 ${beats.length} 拍逐一定位，画面属于正确的幕且不空`, async () => {
    if (shots) mkdirSync(out, { recursive: true });
    for (const [i, b] of beats.entries()) {
      await seek(b.t);
      assert.equal(await page.locator('.stage').getAttribute('data-scene'), b.scene, `${b.scene}/${b.beat}`);
      const n = await page.locator('.stage *').count();
      assert.ok(n > 30, `${b.scene}/${b.beat} 只有 ${n} 个元素`);
      if (shots) await page.waitForTimeout(500);
      if (shots) await page.locator('.frame').screenshot({ path: `${out}${String(i).padStart(3, '0')}-${b.scene}-${b.beat}.png` });
    }
  });

  await check('同一时刻画两次，SVG 完全相同', async () => {
    const t = beats.find(b => b.scene === 'fourier' && b.beat === 'transform').t;
    await seek(t);
    const a = await page.locator('.stage').evaluate(el => el.outerHTML);
    await seek(10);
    await seek(t);
    assert.equal(await page.locator('.stage').evaluate(el => el.outerHTML), a);
  });

  await check('地图面板剪掉 Fourier：时间线变短，Nim 里提到它的那句消失，URL 带上 prune', async () => {
    const before = await film(() => window.__film.timeline.total);
    await page.keyboard.press('m');
    await page.locator('[data-branch=fourier]').click();
    await settle();
    const tl = await film(() => ({ total: window.__film.timeline.total, ids: window.__film.timeline.entries.map(e => e.id), nim: window.__film.timeline.entries.find(e => e.id === 'nim').beats.map(b => b.id) }));
    assert.ok(tl.total < before);
    assert.ok(!tl.ids.includes('fourier'));
    assert.ok(!tl.nim.includes('link-fourier'));
    assert.match(page.url(), /prune=fourier/);
  });

  await check('剪掉“函子”，长在它上面的“自然变换”一起消失，它的开关变灰', async () => {
    await page.locator('[data-branch=functor]').click();
    await settle();
    const ids = await film(() => window.__film.timeline.entries.map(e => e.id));
    assert.ok(!ids.includes('functor') && !ids.includes('natural'));
    assert.equal(await page.locator('[data-branch=natural]').isDisabled(), true);
    if (shots) await page.locator('.frame').screenshot({ path: `${out}map-panel.png` });
    await page.keyboard.press('Escape');
  });

  await check('带着剪枝参数打开链接，得到同一个剪辑', async () => {
    const page2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page2.goto(`${url}?prune=functor,fourier&speed=1.5`);
    await page2.locator('.stage').waitFor();
    const s = await page2.evaluate(() => ({ pruned: window.__film.state.pruned, speed: window.__film.state.speed }));
    assert.deepEqual(s, { pruned: ['fourier', 'functor'], speed: 1.5 });
    await page2.close();
  });

  await check('全程没有页面错误', async () => {
    assert.deepEqual(errors, []);
  });
} finally {
  await browser.close();
  await new Promise(r => server.httpServer.close(r));
}
