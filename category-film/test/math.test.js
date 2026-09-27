// 片子里显示的每个数都来自这些函数。这里证明它们说的是真话。
import { describe, it, expect } from 'vitest';
import { over, rgba, foldLeft, foldTree, parenthesisGap, commutatorGap, walk, pose, commutatorWord } from '../src/math/semigroup.js';
import { scan, diff, mobius, totient, zeta, mobiusInvert, divisors, hasseEdges } from '../src/math/incidence.js';
import { indicator, convolve, convolveByFourier, dft, character, cmul, cabs } from '../src/math/fourier.js';
import { SEMIRINGS, matpow, weightMatrix, bestPath, softmaxH, tropicalPoly, DEMO_POLY } from '../src/math/tropical.js';
import { nimSum, winningMove, playNim, mex, grundyTable, stalk, add, neg, eq, le, outcome, game, ZERO, stalkValue, formatFraction } from '../src/math/games.js';

const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

describe('半群', () => {
  const [a, b, c] = [rgba('#cf4128', 0.7), rgba('#eab52c', 0.8), rgba('#2855b8', 0.6)];

  it('over 满足结合律，不满足交换律', () => {
    expect(close(over(over(a, b), c), over(a, over(b, c)))).toBe(true);
    expect(close(over(a, b), over(b, a))).toBe(false);
  });

  it('foldl 与树形 fold 在结合运算下相同，在非结合运算下不同', () => {
    expect(foldLeft((x, y) => x + y, [1, 2, 3, 4, 5])).toBe(foldTree((x, y) => x + y, [1, 2, 3, 4, 5]));
    expect(foldLeft((x, y) => x - y, [1, 2, 3, 4])).not.toBe(foldTree((x, y) => x - y, [1, 2, 3, 4]));
  });

  it('画纸逐像素的括号差为 0', () => {
    const sheets = [
      { color: '#cf4128', alpha: 0.7, shape: { kind: 'circle', cx: 0.4, cy: 0.4, r: 0.3 } },
      { color: '#2855b8', alpha: 0.6, shape: { kind: 'polygon', pts: [[0.3, 0.3], [0.9, 0.3], [0.9, 0.9], [0.3, 0.9]] } },
      { color: '#1f1c24', alpha: 0.7, shape: { kind: 'polygon', pts: [[0, 0.6], [0.6, 0], [0.7, 0.1], [0.1, 0.7]] } },
    ];
    expect(parenthesisGap(sheets)).toBeLessThan(1e-12);
  });

  it('平移可交换，交换子闭合；前进和转向不可交换，缺口是 √2', () => {
    expect(commutatorGap('east', 'north')).toBeCloseTo(0);
    expect(commutatorGap('forward', 'left')).toBeCloseTo(Math.SQRT2);
    const end = walk(pose(), commutatorWord('forward', 'left')).at(-1);
    expect(end.th).toBeCloseTo(0);
  });
});

describe('Möbius', () => {
  it('diff 是 scan 的逆', () => {
    const g = [3, 1, 4, 1, 5, 9, 2, 6];
    expect(diff(scan(g))).toEqual(g);
  });

  it('μ 的前几个值', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 30].map(mobius)).toEqual([1, -1, -1, 0, -1, 1, -1, 0, 0, 1, 0, -1]);
  });

  it('Σ_{d|n} φ(d) = n，反演回来就是 φ', () => {
    for (let n = 1; n <= 60; n++) {
      expect(zeta(totient)(n)).toBe(n);
      expect(mobiusInvert(m => m)(n)).toBe(totient(n));
    }
  });

  it('对任意 g，μ(ζ g) = g', () => {
    const g = n => (n * 7919) % 13;
    for (let n = 1; n <= 60; n++) expect(mobiusInvert(zeta(g))(n)).toBe(g(n));
  });

  it('12 的 Hasse 图有 7 条边', () => {
    expect(divisors(12)).toEqual([1, 2, 3, 4, 6, 12]);
    expect(hasseEdges(12)).toHaveLength(7);
  });
});

describe('Fourier', () => {
  const N = 16;
  const A = [1, 2, 5, 7];

  it('特征标把加法变成乘法', () => {
    const chi = character(3, N);
    const [x, y] = [5, 13];
    const lhs = chi((x + y) % N);
    const rhs = cmul(chi(x), chi(y));
    expect(lhs.re).toBeCloseTo(rhs.re);
    expect(lhs.im).toBeCloseTo(rhs.im);
  });

  it('经由 Fourier 的卷积等于直接数出来的', () => {
    const f = indicator(A, N);
    const direct = convolve(f, f);
    const viaF = convolveByFourier(f, f);
    direct.forEach((v, i) => expect(viaF[i]).toBeCloseTo(v));
    expect(direct[12]).toBe(2);
    expect(direct[5]).toBe(0);
  });

  it('Â(0) = |A|', () => {
    expect(cabs(dft(indicator(A, N))[0])).toBeCloseTo(4);
  });
});

describe('热带', () => {
  const edges = [[0, 1, 4], [0, 2, 2], [1, 2, 1], [1, 3, 5], [2, 3, 8], [2, 4, 10], [3, 4, 2]];
  const D = weightMatrix(5, edges);

  it('(min,+) 的幂给出最多 k 段的最短路，A→E 依次是 ∞, 12, 11, 10', () => {
    expect([1, 2, 3, 4].map(k => matpow(SEMIRINGS.minPlus, D, k)[0][4])).toEqual([Infinity, 12, 11, 10]);
    expect(bestPath(D, 0, 4, 4)).toEqual({ cost: 10, path: [0, 2, 1, 3, 4] });
  });

  it('D⁴ 已经是不动点', () => {
    expect(matpow(SEMIRINGS.minPlus, D, 5)).toEqual(matpow(SEMIRINGS.minPlus, D, 4));
  });

  it('h → 0 时 log-sum-exp 收敛到 max', () => {
    const f = tropicalPoly(DEMO_POLY);
    for (const x of [-2, 0, 1, 2.5, 4]) {
      const vals = DEMO_POLY.map(([c, k]) => c + k * x);
      expect(softmaxH(0.001, vals)).toBeCloseTo(f(x), 2);
      expect(softmaxH(1, vals)).toBeGreaterThan(f(x));
    }
  });
});

describe('博弈', () => {
  it('Nim：异或为 0 时没有必胜走法；否则必胜走法把异或拨回 0', () => {
    expect(nimSum([3, 4, 5])).toBe(2);
    expect(winningMove([1, 4, 5])).toBe(null);
    const m = winningMove([3, 4, 5]);
    const after = [3, 4, 5].map((h, i) => (i === m.heap ? m.to : h));
    expect(nimSum(after)).toBe(0);
  });

  it('红方按策略走必胜，而且每次走完异或都是 0', () => {
    const g = playNim([3, 4, 5]);
    expect(g.winner).toBe('red');
    g.log.forEach((mv, i) => mv.player === 'red' && expect(nimSum(g.states[i + 1])).toBe(0));
  });

  it('mex 与“拿 1 或 2”的 Grundy 值 0,1,2 循环', () => {
    expect(mex([0, 1, 3])).toBe(2);
    expect(grundyTable(8, [1, 2])).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2]);
  });

  it('BR = {0 | 1} = ½，且 ½ + ½ − 1 = 0（后手必胜）', () => {
    const one = game([ZERO], []);
    expect(eq(stalk('BR'), game([ZERO], [one]))).toBe(true);
    expect(outcome(add(add(stalk('BR'), stalk('BR')), stalk('R')))).toBe('second');
    expect(eq(add(stalk('BR'), stalk('BR')), stalk('B'))).toBe(true);
  });

  it('G + (−G) = 0，且 Berlekamp 读数与博弈比较一致', () => {
    const G = stalk('BRRB');
    expect(eq(add(G, neg(G)), ZERO)).toBe(true);
    // 3/8 介于 1/4 与 1/2 之间
    expect(le(stalk('BRR'), G) && le(G, stalk('BR'))).toBe(true);
    expect(formatFraction(stalkValue('BRRB'))).toBe('3/8');
    expect(formatFraction(stalkValue('BBR'))).toBe('3/2');
    expect(formatFraction(stalkValue('RR'))).toBe('−2');
  });
});

describe('数学标签的上下标切分', async () => {
  const { scriptRuns } = await import('../src/paint/brush.js');
  it('_x、_(…)、^(…) 各成一段，其余原样保留', () => {
    expect(scriptRuns('Σ_(d|n) μ(n/d) f(d)')).toEqual([
      { t: 'Σ', kind: null },
      { t: 'd|n', kind: 'sub' },
      { t: ' μ(n/d) f(d)', kind: null },
    ]);
    expect(scriptRuns('c_ij = e^(2πi)')).toEqual([
      { t: 'c', kind: null },
      { t: 'ij', kind: 'sub' },
      { t: ' = e', kind: null },
      { t: '2πi', kind: 'sup' },
    ]);
    expect(scriptRuns('a ⊕ b')).toEqual([{ t: 'a ⊕ b', kind: null }]);
  });
});
