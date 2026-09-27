// 第三幕：半环是可以注入的依赖。同一个矩阵乘法，换半环就换了含义。

export const SEMIRINGS = {
  counting: { name: '(+, ×)', add: (a, b) => a + b, mul: (a, b) => a * b, zero: 0, one: 1 },
  boolean: { name: '(∨, ∧)', add: (a, b) => a || b, mul: (a, b) => a && b, zero: false, one: true },
  minPlus: { name: '(min, +)', add: Math.min, mul: (a, b) => a + b, zero: Infinity, one: 0 },
  maxPlus: { name: '(max, +)', add: Math.max, mul: (a, b) => a + b, zero: -Infinity, one: 0 },
};

export const matmul = S => (A, B) =>
  A.map(row => B[0].map((_, j) => row.reduce((acc, a, k) => S.add(acc, S.mul(a, B[k][j])), S.zero)));

export const matpow = (S, A, k) => Array.from({ length: k - 1 }).reduce(M => matmul(S)(M, A), A);

// 无向带权图 → (min, +) 的“一步”矩阵：对角线是 0（原地不动），没有路是 ∞。
export function weightMatrix(n, edges) {
  const W = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const [a, b, w] of edges) W[a][b] = W[b][a] = w;
  return W;
}

export function adjacency(n, edges, withSelf = false) {
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (withSelf && i === j ? 1 : 0)));
  for (const [a, b] of edges) A[a][b] = A[b][a] = 1;
  return A;
}

// 最多走 hops 步时 s→t 的最短路径本身（用来在图上描出来）。
export function bestPath(W, s, t, hops) {
  let best = W.map((_, v) => ({ cost: v === s ? 0 : Infinity, path: [s] }));
  for (let h = 0; h < hops; h++) {
    best = W.map((_, v) =>
      best.reduce(
        (acc, u, i) => {
          const c = u.cost + W[i][v];
          return c < acc.cost ? { cost: c, path: i === v ? u.path : [...u.path, v] } : acc;
        },
        { cost: Infinity, path: [] },
      ),
    );
  }
  return best[t];
}

// 热带多项式：max 在各项上取，项是 c + k·x。
export const tropicalPoly = terms => x => Math.max(...terms.map(([c, k]) => c + k * x));
export const dominant = terms => x => terms.reduce((best, [c, k], i) => (c + k * x > terms[best][0] + terms[best][1] * x ? i : best), 0);

// 去量子化：h·log(Σ e^{v/h}) → max(v) 当 h → 0。数值上按 log-sum-exp 的稳定写法算。
export function softmaxH(h, values) {
  const m = Math.max(...values);
  return m + h * Math.log(values.reduce((s, v) => s + Math.exp((v - m) / h), 0));
}

// 片中反复出现的那条热带多项式：max(2, x+1, 2x−2)，每项是 [系数, 次数]。
export const DEMO_POLY = [[2, 0], [1, 1], [-2, 2]];
