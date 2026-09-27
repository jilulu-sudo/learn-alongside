import { Label, Arrow, Card } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, seg } from '../paint/ease.js';

const beats = [
  { id: 'head', say: '最后一个问题：head 从数组里取出第一个元素，装进 Maybe。它关心元素是什么吗？' },
  { id: 'square', say: '不关心。所以先乘十再取头，和先取头再乘十，结果一样。这个方块交换，叫自然性。' },
  { id: 'break', say: '换成“取第一个偶数”：它要看元素的内容。先乘十，第一个偶数是 10；先取，再乘十，是 20。方块不交换了。' },
  { id: 'poly', say: '自然变换，就是“只看形状、不看内容”的变换。在类型里它写作 ∀a. Array a → Maybe a；只要写得出这个类型，自然性就是白送的。' },
];

const head = xs => (xs.length ? { just: xs[0] } : null);
const firstEven = xs => {
  const e = xs.find(x => x % 2 === 0);
  return e === undefined ? null : { just: e };
};
const mapArr = f => xs => xs.map(f);
const mapMaybe = f => m => (m ? { just: f(m.just) } : null);
const show = m => (Array.isArray(m) ? `[${m.join(', ')}]` : m ? `Just ${m.just}` : 'Nothing');

const XS = [1, 2, 3];
const times10 = x => x * 10;

function square(eta) {
  const top = mapArr(times10)(XS);
  return {
    tl: show(XS),
    tr: show(top),
    bl: show(eta(XS)),
    viaTop: show(eta(top)),
    viaLeft: show(mapMaybe(times10)(eta(XS))),
  };
}
const HEAD = square(head);
const EVEN = square(firstEven);

const TL = [640, 330];
const TR = [1280, 330];
const BL = [640, 700];
const BR = [1280, 700];

function Square({ sq, name, p, opacity }) {
  const ok = sq.viaTop === sq.viaLeft;
  const top = easeInOut(seg(p, 0.1, 0.4));
  const right = easeInOut(seg(p, 0.4, 0.6));
  const left = easeInOut(seg(p, 0.1, 0.3));
  const bottom = easeInOut(seg(p, 0.3, 0.6));
  const done = easeOut(seg(p, 0.65, 0.85));
  return (
    <g opacity={opacity}>
      <Label x={TL[0]} y={TL[1] + 12} size={40} font="mono">{sq.tl}</Label>
      <Label x={TR[0]} y={TR[1] + 12} size={40} font="mono" opacity={top}>{sq.tr}</Label>
      <Label x={BL[0]} y={BL[1] + 12} size={40} font="mono" opacity={left}>{sq.bl}</Label>
      <Arrow from={TL} to={TR} gap={130} color={C.red} label="map(×10)" size={28} progress={top} />
      <Arrow from={TR} to={BR} gap={60} color={C.red} label={name} size={28} progress={right} />
      <Arrow from={TL} to={BL} gap={60} color={C.blue} label={name} size={28} bend={0.01} progress={left} />
      <Arrow from={BL} to={BR} gap={130} color={C.blue} label="map(×10)" size={28} progress={bottom} />
      <Label x={BR[0]} y={BR[1] - 30} size={36} font="mono" color={C.red} opacity={done}>{sq.viaTop}</Label>
      <Label x={BR[0]} y={BR[1] + 36} size={36} font="mono" color={C.blue} opacity={done}>{sq.viaLeft}</Label>
      <Label x={W / 2} y={530} size={60} color={ok ? C.green : C.red} opacity={done}>{ok ? '✓' : '✗'}</Label>
    </g>
  );
}

function View({ clock }) {
  const p = Object.fromEntries(beats.map(b => [b.id, clock.p(b.id)]));
  return (
    <g>
      <Label x={W / 2} y={220} size={34} font="mono" opacity={inOut(p.head, seg(p.break, 0, 0.2))}>head : Array a → Maybe a</Label>
      <Square sq={HEAD} name="head" p={Math.max(seg(p.head, 0.4, 1) * 0.35, p.square)} opacity={inOut(seg(p.head, 0.2, 0.5), seg(p.break, 0, 0.2))} />
      <Square sq={EVEN} name="firstEven" p={p.break} opacity={inOut(seg(p.break, 0.1, 0.3), seg(p.poly, 0, 0.2))} />
      <g opacity={easeOut(seg(p.poly, 0.1, 0.4))}>
        <Card x={360} y={300} w={1200} h={380} />
        <Label x={W / 2} y={400} size={44} font="math" italic>η : ∀a. Array a → Maybe a</Label>
        <Label x={W / 2} y={480} size={34} font="math" italic>map_Maybe(f) ∘ η = η ∘ map_Array(f)</Label>
        <Label x={W / 2} y={570} size={30}>能对所有 a 写出来 ⇒ 它不可能偷看元素 ⇒ 方块必然交换</Label>
        <Label x={W / 2} y={630} size={26} color={C.pencil}>Wadler 叫它“免费定理”（theorems for free）</Label>
      </g>
    </g>
  );
}

export default { beats, View };
