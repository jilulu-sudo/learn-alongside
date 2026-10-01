// 课程的装配：章节顺序就是这个数组的顺序。每一章 = 一个场景 + 一个实验（lab）+ 一段代码。
import { config } from './config.js';
import { compose } from './core/timeline.js';
import { scene as sign } from './scenes/sign.jsx';
import { scene as value } from './scenes/value.jsx';
import { scene as gen } from './scenes/gen.jsx';
import { scene as errors } from './scenes/errors.jsx';
import { scene as retry } from './scenes/retry.jsx';
import { scene as fibers } from './scenes/fibers.jsx';
import { scene as layers } from './scenes/layers.jsx';
import { scene as scope } from './scenes/scope.jsx';
import { scene as cloth } from './scenes/cloth.jsx';

export const SCENES = [sign, value, gen, errors, retry, fibers, layers, scope, cloth];
export const CHAPTERS = SCENES.map(s => s.id);
export const BY_ID = Object.fromEntries(SCENES.map(s => [s.id, s]));
export const LABS = Object.fromEntries(SCENES.map(s => [s.id, s.lab]));

// 本章的时间线只由“已经跑完的参数与记录”决定；还没有记录时返回 null。
export function timelineOf(state, id) {
  const run = state.runs[id];
  return run ? compose(BY_ID[id], run, config.pace) : null;
}

export const replayBeat = id => BY_ID[id].replay;
