// 第二幕：偏序上的 ζ（累加）与 μ（它的逆）。链上是 scan / diff，整除格上是经典的 Möbius 反演。

export const scan = xs => xs.reduce((acc, x) => [...acc, (acc.at(-1) ?? 0) + x], []);
export const diff = xs => xs.map((x, i) => x - (i ? xs[i - 1] : 0));

export const divisors = n => Array.from({ length: n }, (_, i) => i + 1).filter(d => n % d === 0);

export function mobius(n) {
  let m = n;
  let sign = 1;
  for (let p = 2; p * p <= m; p++) {
    if (m % p) continue;
    m /= p;
    if (m % p === 0) return 0;
    sign = -sign;
  }
  return m > 1 ? -sign : sign;
}

export const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export const totient = n => Array.from({ length: n }, (_, i) => i + 1).filter(k => gcd(k, n) === 1).length;

export const zeta = g => n => divisors(n).reduce((s, d) => s + g(d), 0);
export const mobiusInvert = f => n => divisors(n).reduce((s, d) => s + mobius(n / d) * f(d), 0);

// d 覆盖 e（Hasse 图的边）：e | d 且中间没有别的因子。
export function hasseEdges(n) {
  const ds = divisors(n);
  return ds.flatMap(d =>
    ds.filter(e => e < d && d % e === 0 && !ds.some(m => m > e && m < d && d % m === 0 && m % e === 0)).map(e => [e, d]),
  );
}
