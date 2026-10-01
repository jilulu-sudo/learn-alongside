// 地址栏 ⇄ 初始状态。只记章节和时间：?ch=retry&t=12.5 ；?chrome=0 隐藏控制条（投屏用）。
export function parseQuery(search, chapters) {
  const q = new URLSearchParams(search);
  const chapter = chapters.includes(q.get('ch')) ? q.get('ch') : undefined;
  const t = Number(q.get('t'));
  return { state: { chapter, t: Number.isFinite(t) && t > 0 ? t : 0 }, chrome: q.get('chrome') !== '0' };
}

export function toQuery({ chapter, t }, { chrome = true, first } = {}) {
  const q = new URLSearchParams();
  if (chapter !== first || t > 0) q.set('ch', chapter);
  if (t > 0.5) q.set('t', String(Math.round(t * 10) / 10));
  if (!chrome) q.set('chrome', '0');
  const s = q.toString();
  return s ? `?${s}` : '';
}
