// 证明测试真的会失败：在临时副本里往 domain.js 植入已知 bug，每个 bug 都必须让至少一条测试变红。
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const MUTANTS = [
  ['用 UTC 日期当今天', 'return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;', 'return now.toISOString().slice(0, 10);'],
  ['忽略传入的时间', 'return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;', 'return new Date().toISOString().slice(0, 10);'],
  ['月末不截断', 'first.setUTCDate(Math.min(d, lastDay));', 'first.setUTCDate(d);'],
  ['年付不折算成月', "it.amountCents / 12", 'it.amountCents'],
  ['7 天窗口差一天', 'row.date < end', 'row.date <= end'],
  ['一次性水果买了还出现', 'if (it.everyDays === null) return null;', 'if (it.everyDays === null) return today;'],
  ['没东西要买也发消息', 'if (rows.length === 0) return null;', ''],
  ['过期的分享也算', "it.date >= today ? it.date : null", 'it.date'],
];

let survived = 0;
for (const [name, from, to] of MUTANTS) {
  const dir = mkdtempSync(join(tmpdir(), 'mutant-'));
  cpSync(join(repo, 'app'), join(dir, 'app'), { recursive: true });
  cpSync(join(repo, 'test'), join(dir, 'test'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
  const file = join(dir, 'app', 'domain.js');
  const src = readFileSync(file, 'utf8');
  if (!src.includes(from)) throw new Error(`变异点已不存在，请更新脚本：${name}`);
  writeFileSync(file, src.replace(from, to));
  const run = spawnSync(process.execPath, ['--test', join(dir, 'test', 'domain.test.js')], { cwd: dir });
  const killed = run.status !== 0;
  if (!killed) survived++;
  console.log(`${killed ? 'KILLED  ' : 'SURVIVED'} ${name}`);
  rmSync(dir, { recursive: true, force: true });
}
console.log(survived ? `\n${survived} 个 bug 没被任何测试发现` : `\n${MUTANTS.length} 个植入的 bug 全部被测试发现`);
process.exit(survived ? 1 : 0);
