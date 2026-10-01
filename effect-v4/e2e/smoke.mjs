// 在真浏览器里放一遍构建产物：能播、每一章每一拍都能画、同一时刻画面相同、
// 拨旋钮会真的重跑程序并回放、手机宽度不横向滚动、深色主题生效、全程没有页面错误。
// 用法：npm run build && npm run smoke        加 --shots 顺便给每一拍截一张图到 e2e/out/
import { chromium } from 'playwright';
import { preview } from 'vite';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = fileURLToPath(new URL('./out/', import.meta.url));
const shots = process.argv.includes('--shots');

const server = await preview({ root, preview: { port: 4174, strictPort: false, host: '127.0.0.1' }, logLevel: 'silent' });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const errors = [];
// 网页字体来自 Google Fonts；离线或被代理拦下时会退回系统字体，这不算页面错误。
const ignorable = text => /fonts\.(googleapis|gstatic)\.com|Failed to load resource/.test(text);
const watch = page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && !ignorable(m.text()) && errors.push(m.text()));
};
const check = async (name, fn) => {
  await fn();
  console.log(`PASS ${name}`);
};

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
  watch(page);
  const app = fn => page.evaluate(fn);
  const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const seek = async t => {
    await page.evaluate(t => window.__course.seek(t), t);
    await settle();
  };
  const go = async id => {
    await page.evaluate(id => window.__course.go(id), id);
    await page.waitForFunction(id => window.__course.state.chapter === id && window.__course.timeline, id);
  };

  await page.goto(url);
  await page.waitForFunction(() => window.__course?.timeline);

  await check('点“开始”，时间开始走，字幕出现；空格暂停', async () => {
    await page.getByRole('button', { name: '▶ 开始' }).click();
    await page.waitForTimeout(1500);
    assert.ok((await app(() => window.__course.state.t)) > 0.8);
    assert.ok((await page.getByTestId('caption').innerText()).length > 5);
    await page.keyboard.press(' ');
    assert.equal(await app(() => window.__course.state.playing), false);
  });

  const chapters = await app(() => [...document.querySelectorAll('.chapters .seal')].map(b => b.title));
  await check(`${chapters.length} 章都在导航里`, async () => assert.equal(chapters.length, 9));

  let total = 0;
  await check('每一章每一拍都能定位，画面属于正确的章和拍，且不空', async () => {
    if (shots) mkdirSync(out, { recursive: true });
    const ids = ['sign', 'value', 'gen', 'errors', 'retry', 'fibers', 'layers', 'scope', 'cloth'];
    for (const [ci, id] of ids.entries()) {
      await go(id);
      const beats = await app(() => window.__course.timeline.beats.map(b => ({ id: b.id, t: b.start + (b.end - b.start) * 0.85 })));
      for (const [bi, b] of beats.entries()) {
        await seek(b.t);
        const stage = page.locator('.stage');
        assert.equal(await stage.getAttribute('data-scene'), id);
        assert.equal(await stage.getAttribute('data-beat'), b.id, `${id}/${b.id}`);
        const n = await page.locator('.stage *').count();
        assert.ok(n > 12, `${id}/${b.id} 只有 ${n} 个元素`);
        total++;
        if (shots) await page.locator('.frame').screenshot({ path: `${out}${ci}${String(bi).padStart(2, '0')}-${id}-${b.id}.png` });
      }
    }
    console.log(`     共 ${total} 拍`);
  });

  await check('同一时刻画两次，SVG 完全相同', async () => {
    await go('fibers');
    const t = await app(() => window.__course.timeline.beats.find(b => b.id === 'bounded').start + 1.2);
    await seek(t);
    const a = await page.locator('.stage').evaluate(el => el.outerHTML);
    await seek(0.5);
    await seek(t);
    assert.equal(await page.locator('.stage').evaluate(el => el.outerHTML), a);
  });

  await check('第四章：把 timeout 拨到 800 毫秒，程序在测试时钟上重跑，读数变成 TimeoutError，并从回放那一拍开始播放', async () => {
    await go('retry');
    await page.locator('[data-knob=timeout][data-value="800"]').click();
    await page.getByTestId('readout').filter({ hasText: 'TimeoutError' }).waitFor();
    assert.match(await page.getByTestId('readout').innerText(), /800ms/);
    await page.waitForFunction(() => window.__course.state.playing);
    assert.equal(await page.locator('.stage').getAttribute('data-beat'), 'run');
    await page.keyboard.press(' ');
  });

  await check('第六章：忘了提供 Http，读数里是运行时真实报出的 Service not found', async () => {
    await go('layers');
    await page.locator('[data-knob=http][data-value=false]').click();
    await page.getByTestId('readout').filter({ hasText: 'Service not found: app/Http' }).waitFor();
    await page.keyboard.press(' ');
  });

  await check('代码面板跟着拍高亮', async () => {
    await go('errors');
    const t = await app(() => window.__course.timeline.beats.find(b => b.id === 'catchTag').start + 0.5);
    await seek(t);
    const hot = await page.locator('.code-box .hot').allInnerTexts();
    assert.ok(hot.some(l => l.includes('Effect.catchTag("NotFound"')), hot.join('\n'));
  });

  await check('代码面板不需要横向滚动就能看全', async () => {
    const dimensions = await page.locator('.code-box').evaluate(el => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    assert.ok(dimensions.scrollWidth <= dimensions.clientWidth + 1, JSON.stringify(dimensions));
  });

  await check('带参数打开链接，直接到那一章那一刻', async () => {
    const p = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    watch(p);
    await p.goto(`${url}?ch=scope&t=5`);
    await p.waitForFunction(() => window.__course?.timeline);
    assert.equal(await p.locator('.stage').getAttribute('data-scene'), 'scope');
    assert.ok(Math.abs((await p.evaluate(() => window.__course.state.t)) - 5) < 0.01);
    await p.close();
  });

  await check('手机宽度：没有横向滚动，舞台、字幕、旋钮、代码都在', async () => {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    watch(p);
    await p.goto(`${url}?ch=fibers`);
    await p.waitForFunction(() => window.__course?.timeline);
    const { sw, iw } = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    assert.ok(sw <= iw, `scrollWidth ${sw} > ${iw}`);
    for (const sel of ['.stage', '.caption', '.knob', '.code-box']) assert.ok(await p.locator(sel).first().isVisible(), sel);
    if (shots) await p.screenshot({ path: `${out}mobile.png`, fullPage: true });
    await p.close();
  });

  await check('深色主题：跟随系统，纸变成夜色', async () => {
    const p = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
    watch(p);
    await p.goto(`${url}?ch=layers&t=40`);
    await p.waitForFunction(() => window.__course?.timeline);
    const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.equal(bg, 'rgb(23, 22, 20)');
    if (shots) await p.screenshot({ path: `${out}dark.png` });
    await p.close();
  });

  await check('全程没有页面错误', async () => assert.deepEqual(errors, []));
} finally {
  await browser.close();
  await server.httpServer.close();
}
