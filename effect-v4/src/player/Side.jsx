// 右侧：动手（旋钮 + 真实运行的结果）和代码（屏幕上的每一行都通过了 tsc 类型检查）。
import { useEffect, useMemo, useRef } from 'react';
import { highlighted, linesOf, tokenizeLine } from './highlight.js';
import { keyOf } from '../core/reducer.js';

export function LabPanel({ scene, knobs, run, dispatch }) {
  const pending = run && keyOf(run.params) !== keyOf(knobs);
  const rows = run && !pending && scene.readout ? scene.readout(run) : [];
  return (
    <section className="panel lab" aria-label="动手">
      <h2>
        动手 <small>{scene.labHint ?? '拨一下，程序会真的重跑一遍'}</small>
      </h2>
      {scene.lab.knobs.map(k => (
        <div className="knob" key={k.id} role="radiogroup" aria-label={k.label}>
          <div className="knob-label">{k.label}</div>
          <div className="knob-options">
            {k.options.map(o => (
              <button
                key={String(o.value)}
                role="radio"
                aria-checked={knobs[k.id] === o.value}
                className={knobs[k.id] === o.value ? 'on' : ''}
                data-knob={k.id}
                data-value={String(o.value)}
                onClick={() => dispatch({ type: 'knob', chapter: scene.id, id: k.id, value: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {rows.length > 0 && (
        <dl className="readout" data-testid="readout">
          {rows.map(r => (
            <div key={r.k} className={r.tone ?? ''}>
              <dt>{r.k}</dt>
              <dd>{r.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {pending && <p className="pending">正在运行……</p>}
    </section>
  );
}

export function CodePanel({ scene, anchors }) {
  const lines = useMemo(() => linesOf(scene.code), [scene.code]);
  const tokens = useMemo(() => lines.map(tokenizeLine), [lines]);
  const hot = highlighted(lines, anchors);
  const box = useRef(null);
  const first = Math.min(...hot);
  useEffect(() => {
    const el = box.current?.querySelector(`[data-line="${first}"]`);
    if (el && box.current) {
      const top = el.offsetTop - box.current.clientHeight / 3;
      box.current.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }, [first]);
  return (
    <section className="panel code" aria-label="代码">
      <h2>
        代码 <small>{scene.file}</small>
      </h2>
      <pre ref={box} className="code-box">
        {tokens.map((line, i) => (
          <div key={i} data-line={i} className={hot.has(i) ? 'hot' : ''}>
            <span className="ln">{i + 1}</span>
            {line.map((t, j) => (
              <span key={j} className={`tk-${t.kind}`}>
                {t.text}
              </span>
            ))}
            {line.length === 0 && ' '}
          </div>
        ))}
      </pre>
    </section>
  );
}
