// 场景登记表：地图节点 id → 场景。播放顺序由 core/graph.js 的 NODES 决定，不由这里决定。
import prelude from './prelude.jsx';
import semigroup from './semigroup.jsx';
import commutator from './commutator.jsx';
import mobius from './mobius.jsx';
import fourier from './fourier.jsx';
import tropical from './tropical.jsx';
import dequant from './dequant.jsx';
import nim from './nim.jsx';
import hackenbush from './hackenbush.jsx';
import category from './category.jsx';
import functor from './functor.jsx';
import natural from './natural.jsx';
import coda from './coda.jsx';

export const SCENES = { prelude, semigroup, commutator, mobius, fourier, tropical, dequant, nim, hackenbush, category, functor, natural, coda };
