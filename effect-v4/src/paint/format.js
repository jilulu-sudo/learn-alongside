// 把记录里的 Exit 写成人能读的一行。只用于显示，内容全部来自真实运行的记录。
export function fmtValue(v) {
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(fmtValue).join(', ')}]`;
  if (v === null || v === undefined) return 'void';
  return String(v);
}

export function fmtReason(r) {
  if (r.kind === 'interrupt') return 'Interrupt';
  if (r.kind === 'die') return `Die(${r.message})`;
  return r.tag ? (r.tag === r.message ? `Fail(${r.tag})` : `Fail(${r.tag}: ${r.message})`) : `Fail(Error: ${r.message})`;
}

export function fmtExit(exit) {
  if (!exit) return '';
  if (exit.ok) return `Exit.succeed(${fmtValue(exit.value)})`;
  if (exit.reasons.length === 1) {
    const [r] = exit.reasons;
    if (r.kind === 'interrupt') return 'Exit.interrupt';
    if (r.kind === 'die') return `Exit.die(${r.message})`;
    return `Exit.fail(${r.tag ? (r.tag === r.message ? r.tag : `${r.tag}: ${r.message}`) : `Error: ${r.message}`})`;
  }
  return `Exit.failCause(${exit.reasons.map(fmtReason).join(' + ')})`;
}

export const firstReason = exit => (exit && !exit.ok ? exit.reasons[0] : null);
