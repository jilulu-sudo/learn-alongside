// 画面只回放记录，所以记录必须说真话。这里逐章检查：记录下来的事，就是 Effect v4 文档里说会发生的事。
import { describe, expect, test } from 'vitest';
import { lab as sign } from '../src/labs/sign.js';
import { lab as value } from '../src/labs/value.js';
import { lab as gen } from '../src/labs/gen.js';
import { lab as errors, HAPPENS } from '../src/labs/errors.js';
import { lab as retry } from '../src/labs/retry.js';
import { lab as fibers, DURATIONS } from '../src/labs/fibers.js';
import { lab as layers } from '../src/labs/layers.js';
import { lab as scope } from '../src/labs/scope.js';
import { record } from '../src/effect/record.js';
import { program as retrySnippet } from '../snippets/04-retry.ts';
import { executions, program as valueSnippet } from '../snippets/01-value.ts';
import { bounded, fastest, sequential, unbounded } from '../snippets/05-fibers.ts';
import { home } from '../snippets/07-scope.ts';
import { Effect } from 'effect';
import { TestConsole } from 'effect/testing';

const at = (trace, lane, kind) => trace.events.find(e => e.lane === lane && e.kind === kind)?.t;

describe('序：divide', () => {
  test('throw 的版本只能靠 try/catch 发现；Effect 的版本把失败放进 Exit', async () => {
    const { cases } = await sign.run(sign.defaults);
    expect(cases[2]).toEqual({ plain: { ok: true, value: 2 }, effect: { ok: true, value: 2 } });
    expect(cases[0].plain).toEqual({ ok: false, thrown: 'Cannot divide by zero' });
    expect(cases[0].effect.reasons).toEqual([{ kind: 'fail', tag: null, message: 'Cannot divide by zero' }]);
  });
});

describe('一：程序是值', () => {
  test('创建和组合都不执行；每 runSync 一次才执行一次', async () => {
    for (const runs of [0, 1, 2, 3]) {
      const t = await value.run({ runs, map: true });
      expect(t.afterCreate).toBe(0);
      expect(t.count).toBe(runs);
      expect(t.results).toEqual([10, 20, 30].slice(0, runs));
    }
    expect((await value.run({ runs: 2, map: false })).results).toEqual([1, 2]);
  });

  test('屏幕上的代码（snippets/01-value.ts）：导入时跑了两次，得到 10、20；再跑一次是 30', async () => {
    expect(executions()).toBe(2);
    expect((await value.run({ runs: 2, map: true })).results).toEqual([10, 20]);
    expect(Effect.runSync(valueSnippet)).toBe(30);
    expect(executions()).toBe(3);
  });
});

describe('二：Effect.gen 短路', () => {
  test('Effect.fn 的 span 说明哪几站真的跑了', async () => {
    const names = async input => (await gen.run({ input })).spans.map(s => s.name);
    expect(await names('42')).toEqual(['greetUser', 'parse', 'findUser']);
    expect(await names('abc')).toEqual(['greetUser', 'parse']);
    expect(await names('7')).toEqual(['greetUser', 'parse', 'findUser']);
    const seven = await gen.run({ input: '7' });
    expect(seven.spans.find(s => s.name === 'findUser').exit.reasons[0].tag).toBe('UserNotFound');
    expect(seven.spans.find(s => s.name === 'parse').exit).toEqual({ ok: true, value: 7 });
    expect((await gen.run({ input: '42' })).exit).toEqual({ ok: true, value: '你好，Ada' });
  });

  test('同一个输入记两次，记录完全相同', async () => {
    expect(await gen.run({ input: '7' })).toEqual(await gen.run({ input: '7' }));
  });
});

describe('三：两种错误', () => {
  const run = (happens, handled) => errors.run({ happens, handled }).then(t => t.exit);

  test('不处理：预期内的失败原样留在 E 里', async () => {
    for (const tag of ['NotFound', 'Timeout', 'Unauthorized']) expect((await run(tag, 'none')).reasons).toEqual([{ kind: 'fail', tag, message: tag }]);
  });

  test('catchTag("NotFound") 只接回 NotFound', async () => {
    expect(await run('NotFound', 'NotFound')).toEqual({ ok: true, value: '访客' });
    expect((await run('Timeout', 'NotFound')).reasons[0].tag).toBe('Timeout');
  });

  test('全部接回后不再有 fail；defect 仍然穿过去', async () => {
    for (const h of HAPPENS.filter(h => h !== 'bug')) expect((await run(h, 'all')).ok).toBe(true);
    expect(await run('Unauthorized', 'all')).toEqual({ ok: true, value: '兜底：Unauthorized' });
    const bug = await run('bug', 'all');
    expect(bug.reasons).toEqual([{ kind: 'die', tag: null, message: 'profile is undefined' }]);
  });
});

describe('四：重试与时间', () => {
  test('exponential("100 millis")：每次请求 100ms，等待依次 100、200、400', async () => {
    const t = await retry.run(retry.defaults);
    expect([1, 2, 3, 4].map(k => at(t, k, 'start'))).toEqual([0, 200, 500, 1000]);
    expect(t.exit).toEqual({ ok: true, value: '第 4 次成功' });
    expect(t.end).toBe(1100);
  });

  test('spaced("200 millis")：间隔不变', async () => {
    const t = await retry.run({ ...retry.defaults, schedule: 'spaced' });
    expect([1, 2, 3, 4].map(k => at(t, k, 'start'))).toEqual([0, 300, 600, 900]);
  });

  test('times 是“重试”次数：times: 2 最多执行 3 次，然后带着最后一次的错误失败', async () => {
    const t = await retry.run({ ...retry.defaults, times: 2 });
    expect(t.events.filter(e => e.kind === 'start')).toHaveLength(3);
    expect(t.exit.reasons[0].tag).toBe('Flaky');
  });

  test('timeout 到点切断：等待中被切，或者正在跑的那次被中断', async () => {
    const waiting = await retry.run({ ...retry.defaults, timeout: 800 });
    expect(at(waiting, 0, 'cut')).toBe(800);
    expect(waiting.exit.reasons[0].tag).toBe('TimeoutError');
    const running = await retry.run({ ...retry.defaults, succeedOn: 0, timeout: 2000 });
    expect(at(running, 5, 'start')).toBe(1900);
    expect(at(running, 5, 'interrupt')).toBe(2000);
  });

  test('最长的一种跑法也落在时间轴里', async () => {
    const t = await retry.run({ succeedOn: 0, schedule: 'exponential', times: 5, timeout: 0 });
    expect(t.end).toBe(3700);
  });

  test('屏幕上的代码（snippets/04-retry.ts）跑出同样的结果', async () => {
    const t = await record(mark => retrySnippet.pipe(Effect.tap(() => mark(0, 'done'))));
    expect(t.exit).toEqual({ ok: true, value: '第 4 次成功' });
    expect(at(t, 0, 'done')).toBe(1100);
  });
});

describe('五：并发', () => {
  const span = (trace, n) => [at(trace, n, 'start'), at(trace, n, 'end') ?? at(trace, n, 'fail') ?? at(trace, n, 'interrupt')];
  const maxRunning = trace => {
    let running = 0;
    let max = 0;
    for (const e of trace.events) {
      running += e.kind === 'start' ? 1 : -1;
      max = Math.max(max, running);
    }
    return max;
  };

  test('顺序 770ms、两根 460ms、不限 210ms，和官方文档的输出顺序一致', async () => {
    const t = await fibers.run(fibers.defaults);
    expect([t.seq.end, t.bounded.end, t.unbounded.end]).toEqual([770, 460, 210]);
    expect([maxRunning(t.seq), maxRunning(t.bounded), maxRunning(t.unbounded)]).toEqual([1, 2, 5]);
    expect(t.bounded.events.filter(e => e.kind === 'start').map(e => e.lane)).toEqual([1, 2, 3, 4, 5]);
    expect(DURATIONS.map((d, i) => span(t.unbounded, i + 1)[1])).toEqual(DURATIONS);
  });

  test('一根失败，正在跑的兄弟在同一刻被中断', async () => {
    const { failed } = await fibers.run(fibers.defaults);
    expect(at(failed, 2, 'fail')).toBe(100);
    for (const n of [1, 3, 4, 5]) expect(at(failed, n, 'interrupt')).toBe(100);
  });

  test('顺序执行时失败，后面的任务根本不会开始', async () => {
    const { yours } = await fibers.run({ concurrency: 1, failing: 2 });
    expect(yours.events.map(e => e.lane)).toEqual([1, 1, 2, 2]);
  });

  test('race：任务 2 先到，任务 1 当场被中断', async () => {
    const { race } = await fibers.run(fibers.defaults);
    expect(race.exit).toEqual({ ok: true, value: 2 });
    expect(at(race, 1, 'interrupt')).toBe(100);
  });

  test('屏幕上的代码（snippets/05-fibers.ts）用同样的时长', async () => {
    for (const [program, ms] of [[sequential, 770], [bounded, 460], [unbounded, 210]]) {
      const t = await record(mark => program.pipe(Effect.tap(() => mark(0, 'done'))));
      expect(at(t, 0, 'done')).toBe(ms);
    }
    expect((await record(() => fastest)).exit).toEqual({ ok: true, value: 2 });
  });
});

describe('六：服务与 Layer', () => {
  test('同一个程序，换一块料就换一种行为', async () => {
    const live = { exit: { ok: true, value: '晴天，不用带伞' }, sent: ['晴天，不用带伞'], calls: ['/weather'], missing: [] };
    const test_ = { exit: { ok: true, value: '下雨，记得带伞' }, sent: ['下雨，记得带伞'], calls: [], missing: [] };
    expect(await layers.run({ weather: 'live', http: true })).toEqual({ yours: live, live, test: test_ });
    expect((await layers.run({ weather: 'test', http: false })).yours).toEqual(test_);
  });

  test('缺一块料：类型检查不让过；硬跑的话运行时找不到服务而 die', async () => {
    const t = (await layers.run({ weather: 'live', http: false })).yours;
    expect(t.missing).toEqual(['Http']);
    expect(t.exit.reasons).toEqual([{ kind: 'die', tag: null, message: 'Service not found: app/Http' }]);
  });
});

describe('七：资源与 Scope', () => {
  const run = async trouble => (await scope.run({ trouble })).yours;
  const releases = t => t.events.filter(e => e.kind === 'released').map(e => e.label);

  test('后拿的先还：关窗、关灯、关门', async () => {
    const t = await run('none');
    expect(t.events.filter(e => e.kind === 'acquired').map(e => e.label)).toEqual(['门', '灯', '窗']);
    expect(releases(t)).toEqual(['窗', '灯', '门']);
    expect(t.end).toBe(780);
  });

  test('出错、被打断，登记过的收尾一个都不漏', async () => {
    const failed = await run('fail');
    expect(releases(failed)).toEqual(['窗', '灯', '门']);
    expect(failed.exit.reasons[0].tag).toBe('Spilled');
    const cut = await run('interrupt');
    expect(at(cut, 0, 'interrupted')).toBe(400);
    expect(releases(cut)).toEqual(['窗', '灯', '门']);
    expect(cut.exit.reasons[0].tag).toBe('TimeoutError');
  });

  test('四种情况一起跑，旋钮选中的那一种就是 yours', async () => {
    const t = await scope.run({ trouble: 'fail' });
    expect(Object.keys(t.runs)).toEqual(['none', 'fail', 'interrupt', 'acquire']);
    expect(t.yours).toBe(t.runs.fail);
  });

  test('没拿到的不用还：窗打不开，只还灯和门', async () => {
    const t = await run('acquire');
    expect(releases(t)).toEqual(['灯', '门']);
    expect(t.exit.reasons[0].tag).toBe('Stuck');
  });

  test('屏幕上的代码（snippets/07-scope.ts）打印同样的顺序', async () => {
    const t = await record(() =>
      Effect.gen(function* () {
        yield* home;
        return yield* TestConsole.logLines;
      }).pipe(Effect.provide(TestConsole.layer)),
    );
    expect(t.exit.value).toEqual(['开门', '开灯', '开窗', '关窗', '关灯', '关门']);
  });
});
