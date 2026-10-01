// 把一段真的 Effect 程序放在测试时钟上跑一遍，记下发生了什么。
// 画面只回放这份记录：屏幕上每一个刻度、每一次中断、每一个收尾，都是这段程序真实跑出来的。
import { Cause, Clock, Effect, Exit, Fiber, Option, Tracer } from 'effect';
import { TestClock } from 'effect/testing';

const NS_PER_MS = 1_000_000n;

// 测试时钟每次只往前拨一小格（默认 10ms）。所有演示用的时长都是这一格的整数倍，
// 所以每次醒来都恰好落在格子上，记下来的时间是精确的，不受拨钟方式影响。
export async function record(build, { step = 10, limit = 10_000 } = {}) {
  const events = [];
  const spans = [];
  const mark = (lane, kind, label) =>
    Effect.flatMap(Clock.currentTimeMillis, t => Effect.sync(() => void events.push({ t, lane, kind, label: label ?? null })));

  const program = Effect.withTracer(build(mark), recordingTracer(spans));
  const { exit, end } = await Effect.runPromise(
    Effect.gen(function* () {
      const fiber = yield* Effect.forkChild(program);
      for (let t = 0; !fiber.pollUnsafe() && t < limit; t += step) yield* TestClock.adjust(step);
      const exit = yield* Fiber.await(fiber);
      return { exit, end: Math.max(0, ...events.map(e => e.t), ...spans.map(s => s.end ?? 0)) };
    }).pipe(Effect.provide(TestClock.layer())),
  );
  if (!exit) throw new Error('程序在时间上限内没有结束');
  return { events, spans, exit: summarize(exit), end };
}

// 同步程序不需要时钟，直接跑；记录格式和 record 一样。
// 这时 span 的起止来自真实时钟，每次都不同，所以只保留顺序和父子关系，时间一律记 0。
export function recordSync(build) {
  const events = [];
  const spans = [];
  const mark = (lane, kind, label) => Effect.sync(() => void events.push({ t: 0, lane, kind, label: label ?? null }));
  const exit = Effect.runSyncExit(Effect.withTracer(build(mark), recordingTracer(spans)));
  return { events, spans: spans.map(s => ({ ...s, start: 0, end: 0 })), exit: summarize(exit), end: 0 };
}

function recordingTracer(spans) {
  return Tracer.make({
    span(options) {
      const span = new Tracer.NativeSpan(options);
      const parent = Option.getOrUndefined(options.parent);
      const entry = {
        name: options.name,
        parent: parent && parent._tag === 'Span' ? parent.name : null,
        start: Number(options.startTime / NS_PER_MS),
        end: null,
        exit: null,
      };
      spans.push(entry);
      const end = span.end.bind(span);
      span.end = (endTime, exit) => {
        end(endTime, exit);
        entry.end = Number(endTime / NS_PER_MS);
        entry.exit = summarize(exit);
      };
      return span;
    },
  });
}

// Exit → 纯数据。失败原因按 Cause 里的顺序列出：fail（预期内）、die（defect）、interrupt（中断）。
export function summarize(exit) {
  if (Exit.isSuccess(exit)) return { ok: true, value: plain(exit.value) };
  return {
    ok: false,
    reasons: exit.cause.reasons.map(r =>
      Cause.isFailReason(r)
        ? { kind: 'fail', tag: r.error?._tag ?? null, message: messageOf(r.error) }
        : Cause.isDieReason(r)
          ? { kind: 'die', tag: null, message: messageOf(r.defect) }
          : { kind: 'interrupt', tag: null, message: null },
    ),
  };
}

function messageOf(u) {
  if (u instanceof Error) return u.message || u._tag || u.name;
  if (u && typeof u === 'object' && '_tag' in u) return u._tag;
  return String(u);
}

function plain(v) {
  return v === undefined ? null : JSON.parse(JSON.stringify(v));
}
