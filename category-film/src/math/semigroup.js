// 第一幕用到的真实运算：透明画层的 over（结合、不交换），以及平面刚体运动的交换子。

// 颜色用预乘 alpha 的 [r, g, b, a]，这样 over 就是一行公式。
export const rgba = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => (v / 255) * alpha);
  return [...c, alpha];
};
export const CLEAR = [0, 0, 0, 0];
export const over = (top, bottom) => top.map((v, i) => v + bottom[i] * (1 - top[3]));

export const foldLeft = (op, xs) => xs.reduce((acc, x) => op(acc, x));
export const foldTree = (op, xs) =>
  xs.length === 1 ? xs[0] : op(foldTree(op, xs.slice(0, xs.length >> 1)), foldTree(op, xs.slice(xs.length >> 1)));

// 画纸上的图形：circle {cx, cy, r} 或 polygon {pts}，单位坐标。
export function contains(shape, [x, y]) {
  if (shape.kind === 'circle') return (x - shape.cx) ** 2 + (y - shape.cy) ** 2 <= shape.r ** 2;
  let inside = false;
  const p = shape.pts;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export const sheetAt = (sheet, pt) => (contains(sheet.shape, pt) ? rgba(sheet.color, sheet.alpha) : CLEAR);

// 两种加括号方式在整张纸上的最大像素差。结合律成立时它是 0（浮点误差以内）。
export function parenthesisGap(sheets, grid = 24) {
  let gap = 0;
  for (let i = 0; i <= grid; i++) {
    for (let j = 0; j <= grid; j++) {
      const px = sheets.map(s => sheetAt(s, [i / grid, j / grid]));
      const a = foldLeft(over, px);
      const b = foldTree(over, px);
      gap = Math.max(gap, ...a.map((v, k) => Math.abs(v - b[k])));
    }
  }
  return gap;
}

// ---- 乌龟：位姿 {x, y, th}，动作是位姿到位姿的函数，每个动作带着它的逆 ----
export const pose = (x = 0, y = 0, th = 0) => ({ x, y, th });
export const moves = {
  east: { apply: p => ({ ...p, x: p.x + 1 }), inverse: 'west', name: 'x' },
  west: { apply: p => ({ ...p, x: p.x - 1 }), inverse: 'east', name: 'x⁻¹' },
  north: { apply: p => ({ ...p, y: p.y + 1 }), inverse: 'south', name: 'y' },
  south: { apply: p => ({ ...p, y: p.y - 1 }), inverse: 'north', name: 'y⁻¹' },
  forward: { apply: p => ({ ...p, x: p.x + Math.cos(p.th), y: p.y + Math.sin(p.th) }), inverse: 'back', name: 'a' },
  back: { apply: p => ({ ...p, x: p.x - Math.cos(p.th), y: p.y - Math.sin(p.th) }), inverse: 'forward', name: 'a⁻¹' },
  left: { apply: p => ({ ...p, th: p.th + Math.PI / 2 }), inverse: 'right', name: 'b' },
  right: { apply: p => ({ ...p, th: p.th - Math.PI / 2 }), inverse: 'left', name: 'b⁻¹' },
};

export const commutatorWord = (a, b) => [a, b, moves[a].inverse, moves[b].inverse];
export const walk = (start, word) => word.reduce((path, m) => [...path, moves[m].apply(path.at(-1))], [start]);

export function commutatorGap(a, b) {
  const end = walk(pose(), commutatorWord(a, b)).at(-1);
  return Math.hypot(end.x, end.y);
}

// 两个副本收到同样两条操作，但到达顺序不同。
export const replicas = (s0, f, g) => ({ fg: g(f(s0)), gf: f(g(s0)) });
