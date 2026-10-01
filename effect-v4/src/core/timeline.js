// 一章 = 一串拍（beat）。拍的旁白和时长可以依赖本章的参数与真实记录（ctx = { params, trace }），
// 但都是纯函数：同样的 ctx 永远排出同样的时间线；同样的 t 永远画出同样的一帧。
const clamp01 = x => Math.min(1, Math.max(0, x));

export const sayOf = (beat, ctx) => (typeof beat.say === 'function' ? beat.say(ctx) : beat.say ?? '');

// 朗读长度：中文一个字算一个字；字母、数字、符号读得快，按 latinWeight 个字算；空白不算。
export function spokenLength(text, latinWeight = 0.35) {
  let n = 0;
  for (const ch of text) n += /\s/.test(ch) ? 0 : ch.codePointAt(0) > 0x2e80 ? 1 : latinWeight;
  return n;
}

export function beatDuration(beat, ctx, pace) {
  const text = sayOf(beat, ctx);
  const spoken = Math.max(pace.minBeat, spokenLength(text, pace.latinWeight) / pace.charsPerSecond + pace.pad);
  if (beat.dur == null) return spoken;
  const fixed = typeof beat.dur === 'function' ? beat.dur(ctx) : beat.dur;
  return Math.max(fixed, spoken);
}

export function compose(scene, ctx, pace) {
  let t = 0;
  const beats = scene.beats.map(beat => {
    const d = beatDuration(beat, ctx, pace);
    const b = { id: beat.id, say: sayOf(beat, ctx), hl: beat.hl ?? [], start: t, end: t + d };
    t += d;
    return b;
  });
  return { id: scene.id, total: t, beats };
}

export function locate(timeline, t) {
  const time = Math.min(timeline.total, Math.max(0, t));
  let index = timeline.beats.findIndex(b => time < b.end);
  if (index === -1) index = timeline.beats.length - 1;
  return { time, index, beat: timeline.beats[index] };
}

export function makeClock(timeline, t) {
  const { time, beat } = locate(timeline, t);
  const find = id => {
    const b = timeline.beats.find(x => x.id === id);
    if (!b) throw new Error(`场景 ${timeline.id} 没有声明拍 ${id}`);
    return b;
  };
  return {
    t: time,
    total: timeline.total,
    beat: beat.id,
    // 某一拍的进度 0..1：没开始是 0，过去了是 1。
    p: id => {
      const b = find(id);
      return clamp01((time - b.start) / (b.end - b.start));
    },
    // 从某一拍开始算起的秒数（没开始是 0），用于按真实时间回放记录。
    since: id => Math.max(0, time - find(id).start),
    // 正在这一拍里。
    in: id => beat.id === id,
  };
}

export const beatStart = (timeline, id) => timeline.beats.find(b => b.id === id)?.start ?? 0;

// 上一拍 / 下一拍的起点。离当前拍起点超过 grace 秒时，“上一拍”先回到当前拍开头。
export function stepBeat(timeline, t, dir, grace = 0.8) {
  const starts = timeline.beats.map(b => b.start);
  if (dir > 0) return starts.find(s => s > t + 1e-6) ?? timeline.total;
  const prev = starts.filter(s => s <= t + 1e-6);
  const current = prev.at(-1) ?? 0;
  return t - current > grace ? current : (prev.at(-2) ?? 0);
}
