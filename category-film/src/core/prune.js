// 剪枝只有一条规则：被剪的是旁枝本身和它的全部子孙；主干剪不掉。
import { isTrunk } from './graph.js';

export function normalizePruned(nodes, ids) {
  const branches = new Set(nodes.filter(n => !isTrunk(n)).map(n => n.id));
  return [...new Set(ids)].filter(id => branches.has(id)).sort();
}

export function keptIds(nodes, pruned) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const cut = new Set(normalizePruned(nodes, pruned));
  const removed = node => cut.has(node.id) || (node.parent ? removed(byId.get(node.parent)) : false);
  return new Set(nodes.filter(n => !removed(n)).map(n => n.id));
}

export function togglePruned(nodes, pruned, id) {
  const next = pruned.includes(id) ? pruned.filter(p => p !== id) : [...pruned, id];
  return normalizePruned(nodes, next);
}
