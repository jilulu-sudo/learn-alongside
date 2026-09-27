// 第二幕旁枝：ℤ/N 上的 Fourier。特征标 χ_k(x) = e^{2πi·kx/N} 把加法变成乘法，
// 于是卷积（加性问题：a + b = n 有几种写法）变成逐点相乘。

export const complex = (re, im = 0) => ({ re, im });
export const cmul = (a, b) => complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const cadd = (a, b) => complex(a.re + b.re, a.im + b.im);
export const cabs = a => Math.hypot(a.re, a.im);
export const cis = angle => complex(Math.cos(angle), Math.sin(angle));

export const character = (k, N) => x => cis((2 * Math.PI * k * x) / N);

export const indicator = (set, N) => Array.from({ length: N }, (_, x) => (set.includes(x) ? 1 : 0));

export function dft(f) {
  const N = f.length;
  return f.map((_, k) => f.reduce((s, v, x) => cadd(s, cmul(complex(v), cis((-2 * Math.PI * k * x) / N))), complex(0)));
}

export function idft(F) {
  const N = F.length;
  return F.map((_, x) => {
    const s = F.reduce((acc, v, k) => cadd(acc, cmul(v, cis((2 * Math.PI * k * x) / N))), complex(0));
    return s.re / N;
  });
}

export function convolve(f, g) {
  const N = f.length;
  return f.map((_, n) => f.reduce((s, fv, a) => s + fv * g[(n - a + N) % N], 0));
}

export const convolveByFourier = (f, g) => {
  const F = dft(f);
  const G = dft(g);
  return idft(F.map((v, k) => cmul(v, G[k])));
};

// 频率 k 上的那支箭头：Â(k) = Σ_{a∈A} e^{-2πi·ka/N}。场景里把每一项首尾相接地画出来。
export const phasorChain = (set, k, N) =>
  set.reduce((pts, a) => [...pts, cadd(pts.at(-1), cis((-2 * Math.PI * k * a) / N))], [complex(0)]);
