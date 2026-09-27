import { config } from '../film.config.js';
import { CHAPTERS } from '../core/graph.js';

export const C = config.palette;
export const F = config.fonts;
export const W = config.stage.width;
export const H = config.stage.height;

export const chapterColor = chapter => C[CHAPTERS[chapter].color];
