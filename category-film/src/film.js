// 把地图、场景和节奏装配成一部片子。derive 按剪枝结果缓存时间线（纯函数 + 缓存）。
import { config } from './film.config.js';
import { NODES } from './core/graph.js';
import { compose } from './core/timeline.js';
import { SCENES } from './scenes/index.js';

export const film = { nodes: NODES, scenes: SCENES, pace: config.pace };

const cache = new Map();
export function derive(pruned) {
  const key = pruned.join();
  if (!cache.has(key)) cache.set(key, compose(film, pruned));
  return cache.get(key);
}
