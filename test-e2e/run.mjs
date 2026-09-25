// 在真浏览器里走一遍完成条件 P1 到 P6。时区设成北京，时钟拨到早上 7 点，这正是 UTC 日期还停在前一天的时段。
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { serve } from '../scripts/serve.mjs';

const shots = fileURLToPath(new URL('../docs/images/', import.meta.url));
const server = await serve(0);
const url = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch();
const results = [];
const check = async (name, fn) => {
  await fn();
  results.push(name);
  console.log(`PASS ${name}`);
};

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai', locale: 'zh-CN' });
  const page = await context.newPage();
  const text = id => page.getByTestId(id).innerText();
  const agendaRows = async () => (await page.getByTestId('agenda').locator('li').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim());

  await page.clock.setFixedTime(new Date('2026-09-25T07:00:00+08:00'));
  await page.goto(url);
  await page.getByTestId('seed').click();

  await check('P6 北京时间 7 点，UTC 已是前一天，页面仍按本地日期算今天', async () => {
    assert.match(await page.evaluate(() => new Date().toISOString()), /^2026-09-24T23/);
    assert.equal(await text('next-activity'), '9/27 周日 用 AI 记账');
  });

  await check('P1 首屏卡片显示每月订阅 ¥88.33', async () => {
    assert.equal(await text('monthly'), '¥88.33');
  });

  await check('P2 7 天内扣费的爱奇艺出现在日程里，10/3 的 iCloud 不出现', async () => {
    const rows = await agendaRows();
    assert.ok(rows.includes('订阅 爱奇艺 VIP 扣 ¥25.00 9/28 周一'), rows.join(' | '));
    assert.ok(!rows.some(r => r.includes('iCloud')), rows.join(' | '));
  });
  await page.screenshot({ path: `${shots}app-home.png`, fullPage: true });

  await check('P3 点“买了”后苹果离开日程，7 天后回来', async () => {
    await page.getByTestId('agenda').locator('li', { hasText: '苹果' }).getByRole('button', { name: '买了' }).click();
    assert.ok(!(await agendaRows()).some(r => r.includes('苹果')));
    assert.equal(await text('fruit-due'), '2 样');
    await page.clock.setFixedTime(new Date('2026-10-02T07:00:00+08:00'));
    await page.reload();
    assert.ok((await agendaRows()).some(r => r.startsWith('水果 苹果 ×6 今天')));
    await page.clock.setFixedTime(new Date('2026-09-25T07:00:00+08:00'));
  });

  await check('P4 表单新加一场更早的分享后，“下次分享”卡片换成它', async () => {
    await page.getByText('学习分享').click();
    const form = page.locator('form[data-kind=activity]');
    await form.getByLabel('主题').fill('番茄工作法');
    await form.getByLabel('主讲人').fill('妈妈');
    await form.getByLabel('日期').fill('2026-09-26');
    await form.getByRole('button').click();
    assert.equal(await text('next-activity'), '明天 番茄工作法');
  });

  await check('边界 金额填错时拒收并提示，填对后总额按年付折算', async () => {
    await page.getByText('订阅（会员、网盘、App）').click();
    const form = page.locator('form[data-kind=subscription]');
    await form.getByLabel('名称').fill('百度网盘');
    await form.getByLabel('每次扣费（元）').fill('二百九十八');
    await form.getByLabel('周期').selectOption('yearly');
    await form.getByLabel('开通日期').fill('2026-02-01');
    await form.getByRole('button').click();
    assert.equal(await text('error'), '金额要是大于 0 的数字');
    assert.equal(await text('monthly'), '¥88.33');
    await form.getByLabel('每次扣费（元）').fill('298');
    await form.getByRole('button').click();
    assert.equal(await text('monthly'), '¥113.17');
  });

  await check('P5 刷新页面后数据还在', async () => {
    await page.reload();
    assert.equal(await text('monthly'), '¥113.17');
    assert.equal(await text('next-activity'), '明天 番茄工作法');
    assert.ok(!(await agendaRows()).some(r => r.includes('苹果')));
  });
  await page.getByTestId('all').locator('summary').click();
  await page.screenshot({ path: `${shots}app-after.png`, fullPage: true });
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${results.length} 条端到端检查全部通过`);
