// 实验：“认领”按钮能不能防止买重？先验证它依赖的前提：两台手机看到的是不是同一份清单。
import { chromium } from 'playwright';
import { serve } from '../scripts/serve.mjs';

const server = await serve(0);
const url = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch();
const phone = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai' });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-09-25T07:00:00+08:00'));
  await page.goto(url);
  return page;
};
const fruit = async page => (await page.getByTestId('agenda').locator('li', { hasText: '水果' }).allInnerTexts()).map(t => t.split(/\s+/).slice(1, 3).join(''));

const dad = await phone();
await dad.getByTestId('seed').click();
const mom = await phone();
console.log('爸爸手机上的水果：', await fruit(dad));
console.log('妈妈手机上的水果：', await fruit(mom), '（她那边是空的，还在显示“载入示例数据”：', await mom.getByTestId('empty').isVisible(), '）');

await dad.getByTestId('agenda').locator('li', { hasText: '苹果' }).getByRole('button', { name: '买了' }).click();
await mom.getByTestId('seed').click();
console.log('爸爸点了“买了”苹果之后，妈妈手机上的水果：', await fruit(mom));

await browser.close();
server.close();
