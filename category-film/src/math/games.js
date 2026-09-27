// 第四幕：Nim、mex、以及 Conway 的 {L | R}。

export const nimSum = heaps => heaps.reduce((a, b) => a ^ b, 0);

export function winningMove(heaps) {
  const s = nimSum(heaps);
  if (s === 0) return null;
  const i = heaps.findIndex(h => (h ^ s) < h);
  return { heap: i, to: heaps[i] ^ s };
}

// 一整局：先手用必胜策略，后手用固定的笨策略（从最多的那罐拿一支）。
export function playNim(start) {
  const states = [start];
  const log = [];
  let heaps = start;
  let red = true;
  while (heaps.some(h => h > 0)) {
    let move;
    if (red) move = winningMove(heaps) ?? { heap: heaps.findIndex(h => h > 0), to: 0 };
    else {
      const i = heaps.indexOf(Math.max(...heaps));
      move = { heap: i, to: heaps[i] - 1 };
    }
    heaps = heaps.map((h, i) => (i === move.heap ? move.to : h));
    log.push({ player: red ? 'red' : 'blue', ...move, taken: states.at(-1)[move.heap] - move.to });
    states.push(heaps);
    red = !red;
  }
  return { states, log, winner: log.at(-1).player };
}

export const mex = set => {
  let m = 0;
  while (set.includes(m)) m++;
  return m;
};

// 减法博弈：每次可以拿走 take 中的任意数目。返回 0..n 每个局面的 Grundy 值。
export const grundyTable = (n, take) =>
  Array.from({ length: n + 1 }).reduce((g, _, i) => [...g, mex(take.filter(k => k <= i).map(k => g[i - k]))], []);

// ---- Conway 博弈：{ L: Game[], R: Game[] } ----
export const game = (L = [], R = []) => ({ L, R });
export const ZERO = game();

// 一根 Hackenbush 枝条，colors 从地面往上，如 'BRRB'。砍掉第 i 节，上面的一起掉。
export function stalk(colors) {
  const cuts = c => [...colors].flatMap((col, i) => (col === c ? [stalk(colors.slice(0, i))] : []));
  return game(cuts('B'), cuts('R'));
}

export const add = (G, H) => game([...G.L.map(g => add(g, H)), ...H.L.map(h => add(G, h))], [...G.R.map(g => add(g, H)), ...H.R.map(h => add(G, h))]);
export const neg = G => game(G.R.map(neg), G.L.map(neg));

// G ≤ H ⇔ 没有 G 的左选项 ≥ H，也没有 H 的右选项 ≤ G。
export function le(G, H) {
  return !G.L.some(gl => le(H, gl)) && !H.R.some(hr => le(hr, G));
}
export const eq = (G, H) => le(G, H) && le(H, G);

// 谁赢：先走的人没路可走就输。
export const leftWinsMovingFirst = G => G.L.some(g => !rightWinsMovingFirst(g));
export const rightWinsMovingFirst = G => G.R.some(g => !leftWinsMovingFirst(g));
export function outcome(G) {
  const l = leftWinsMovingFirst(G);
  const r = rightWinsMovingFirst(G);
  if (l && r) return 'first';
  if (!l && !r) return 'second';
  return l ? 'left' : 'right';
}

// Berlekamp 的读法：同色段是整数，第一次变色后每节权重减半。返回 [分子, 分母]。
export function stalkValue(colors) {
  const sign = c => (c === 'B' ? 1 : -1);
  let num = 0;
  let den = 1;
  let halving = false;
  [...colors].forEach((c, i) => {
    if (i > 0 && c !== colors[0]) halving = true;
    if (!halving) num += sign(c) * den;
    else {
      num *= 2;
      den *= 2;
      num += sign(c);
    }
  });
  return [num, den];
}

export const stalkTerms = colors => {
  const terms = [];
  let halving = false;
  let w = 1;
  [...colors].forEach((c, i) => {
    if (i > 0 && c !== colors[0]) halving = true;
    if (halving) w /= 2;
    terms.push((c === 'B' ? 1 : -1) * w);
  });
  return terms;
};

export function formatFraction([num, den]) {
  const g = (a, b) => (b ? g(b, a % b) : Math.abs(a));
  const d = g(num, den) || 1;
  const [n, m] = [num / d, den / d];
  return m === 1 ? `${n}`.replace('-', '−') : `${n < 0 ? '−' : ''}${Math.abs(n)}/${m}`;
}
