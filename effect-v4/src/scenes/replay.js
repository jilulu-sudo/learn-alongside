// 回放真实记录：屏幕时间 → 记录里的虚拟时间（毫秒）。
import { config } from '../config.js';

export const replayDur = (end, msPerSecond = config.replay.msPerSecond) => end / msPerSecond + config.replay.pad;

export const virtualTime = (clock, beat, end, msPerSecond = config.replay.msPerSecond) => Math.min(end, clock.since(beat) * msPerSecond);

// 把一条记录整理成每条“线”（lane）上的事件表：{ [lane]: { [kind]: t } }。
export function lanes(trace) {
  const out = {};
  for (const e of trace.events) (out[e.lane] ??= {})[e.kind] ??= e.t;
  return out;
}
