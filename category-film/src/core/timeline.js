// 片子 = 时间的纯函数。compose 把 (地图, 场景, 剪枝) 变成一条时间线；
// locate 把全局时间 t 变成“第几幕、第几拍、拍内进度”；makeClock 把它交给场景的 View。
import { keptIds } from './prune.js';

const clamp01 = x => Math.min(1, Math.max(0, x));

export function beatDuration(beat, pace) {
  if (beat.dur != null) return beat.dur;
  const chars = [...(beat.say ?? '')].length;
  return Math.max(pace.minBeat, chars / pace.charsPerSecond + pace.pad);
}

export function compose({ nodes, scenes, pace }, pruned) {
  const kept = keptIds(nodes, pruned);
  const entries = [];
  let t = 0;
  for (const node of nodes) {
    if (!kept.has(node.id)) continue;
    const scene = scenes[node.id];
    if (!scene) throw new Error(`地图上的节点 ${node.id} 没有对应的场景`);
    const start = t;
    const beats = [];
    for (const beat of scene.beats) {
      if (beat.needs && !beat.needs.every(id => kept.has(id))) continue;
      const d = beatDuration(beat, pace);
      beats.push({ id: beat.id, say: beat.say ?? '', start: t, end: t + d });
      t += d;
    }
    entries.push({ id: node.id, node, scene, start, end: t, beats });
  }
  return { total: t, entries, kept };
}

export function locate(timeline, t) {
  const { entries, total } = timeline;
  const time = Math.min(total, Math.max(0, t));
  let index = entries.findIndex(e => time < e.end);
  if (index === -1) index = entries.length - 1;
  const entry = entries[index];
  let beatIndex = entry.beats.findIndex(b => time < b.end);
  if (beatIndex === -1) beatIndex = entry.beats.length - 1;
  return { time, index, entry, beatIndex, beat: entry.beats[beatIndex] };
}

export function makeClock(entry, time, kept) {
  const declared = new Set(entry.scene.beats.map(b => b.id));
  const find = id => {
    if (!declared.has(id)) throw new Error(`场景 ${entry.id} 没有声明拍 ${id}`);
    return entry.beats.find(b => b.id === id);
  };
  const p = id => {
    const b = find(id);
    return b ? clamp01((time - b.start) / (b.end - b.start)) : 0;
  };
  return {
    t: time - entry.start,
    dur: entry.end - entry.start,
    p,
    // 从某一拍开始算起的秒数，用于持续的小动作（呼吸、旋转）。拍被剪掉或未开始时为 0。
    since: id => {
      const b = find(id);
      return b ? Math.max(0, time - b.start) : 0;
    },
    has: id => Boolean(find(id)),
    kept: id => kept.has(id),
    keptSet: kept,
  };
}

// 剪枝改变了时间线后，把播放头挪到“同一个地方”：同一拍的同一进度；
// 那一拍没了就去它所在幕的开头；整幕没了就去下一个还活着的幕。
export function remap(before, after, t) {
  const { entry, beat, time } = locate(before, t);
  const same = after.entries.find(e => e.id === entry.id);
  if (same) {
    const b = same.beats.find(x => x.id === beat.id);
    if (!b) return same.start;
    return b.start + (time - beat.start) * ((b.end - b.start) / (beat.end - beat.start));
  }
  const order = before.entries.map(e => e.id);
  const next = after.entries.find(e => order.indexOf(e.id) > order.indexOf(entry.id));
  return next ? next.start : after.total;
}

// 上一拍 / 下一拍的起点。离当前拍起点超过 grace 秒时，“上一拍”先回到当前拍开头。
export function stepBeat(timeline, t, dir, grace = 0.8) {
  const starts = timeline.entries.flatMap(e => e.beats.map(b => b.start));
  if (dir > 0) return starts.find(s => s > t + 1e-6) ?? timeline.total;
  const prev = starts.filter(s => s <= t + 1e-6);
  const current = prev.at(-1) ?? 0;
  return t - current > grace ? current : (prev.at(-2) ?? 0);
}
