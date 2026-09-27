export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerpPt = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// seg(p, a, b)：把 [a, b] 这一段重新映射成 0..1，用来在一拍之内再分几个小节。
export const seg = (p, a, b) => clamp((p - a) / (b - a));

export const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOut = t => 1 - (1 - t) ** 3;
export const easeIn = t => t * t * t;

// 进场后停留、离场：appear 拍到来时淡入，leave 拍到来时淡出。
export const inOut = (pin, pout = 0) => clamp(easeOut(pin) - easeInOut(pout));

export const pulse = (seconds, period = 1.6) => 0.5 - 0.5 * Math.cos((2 * Math.PI * seconds) / period);
