// 知识地图。片子的结构只由这里决定：NODES 的顺序就是播放顺序，
// 没有 parent 的是主干，有 parent 的是旁枝。剪掉一个旁枝，它的子孙一并剪掉，主干永远保留。
// at 是节点在地图坐标系（1100 × 560）里的位置。

export const CHAPTERS = {
  prelude: { mark: '序', name: '画室', color: 'ink' },
  algebra: { mark: '一', name: '半群与交换子', color: 'red' },
  inversion: { mark: '二', name: 'Möbius 与 Fourier', color: 'blue' },
  tropical: { mark: '三', name: '热带代数', color: 'ochre' },
  games: { mark: '四', name: '组合博弈', color: 'green' },
  category: { mark: '五', name: '范畴论', color: 'violet' },
  coda: { mark: '终', name: '尾声', color: 'ink' },
};

export const NODES = [
  { id: 'prelude', chapter: 'prelude', short: '点与箭头', title: '只画两样东西', at: [60, 300] },
  { id: 'semigroup', chapter: 'algebra', short: '结合律', title: '结合律：括号的自由', at: [215, 330] },
  { id: 'commutator', chapter: 'algebra', parent: 'semigroup', short: '交换子', title: '交换子：合不拢的环路', at: [250, 140] },
  { id: 'mobius', chapter: 'inversion', short: 'ζ 与 μ', title: 'ζ 与 μ：累加和它的逆', at: [385, 255] },
  { id: 'fourier', chapter: 'inversion', parent: 'mobius', short: 'Fourier', title: 'Fourier：把加法变成乘法', at: [420, 460] },
  { id: 'tropical', chapter: 'tropical', short: '换半环', title: '热带：换一套加法和乘法', at: [560, 330] },
  { id: 'dequant', chapter: 'tropical', parent: 'tropical', short: '去量子化', title: '去量子化：曲线冻成折线', at: [600, 135] },
  { id: 'nim', chapter: 'games', short: 'Nim', title: 'Nim：博弈也能相加', at: [720, 255] },
  { id: 'hackenbush', chapter: 'games', parent: 'nim', short: 'Hackenbush', title: 'Hackenbush：画出来的数', at: [760, 460] },
  { id: 'category', chapter: 'category', short: '对象与箭头', title: '范畴：拆掉脚手架', at: [880, 320] },
  { id: 'functor', chapter: 'category', parent: 'category', short: '函子', title: '函子：你的 store 就是一个', at: [915, 150] },
  { id: 'natural', chapter: 'category', parent: 'functor', short: '自然变换', title: '自然变换：只看形状', at: [1040, 80] },
  { id: 'coda', chapter: 'coda', short: '尾声', title: '一幅被你剪过的画', at: [1040, 340] },
];

// 跨章的连线：地图上是虚线，讲的是“这一岛的哪个念头在那一岛又出现了”。
export const LINKS = [
  { from: 'semigroup', to: 'mobius', label: '在可交换群里才能沿偏序求和' },
  { from: 'semigroup', to: 'tropical', label: '换一个幺半群，fold 不变' },
  { from: 'fourier', to: 'nim', label: '异或是 (ℤ/2)ⁿ 的加法' },
  { from: 'tropical', to: 'nim', label: 'minimax 是 (max, min) 上的递归' },
  { from: 'semigroup', to: 'category', label: '幺半群 = 单对象范畴' },
  { from: 'mobius', to: 'category', label: '偏序集是范畴，μ 住在关联代数里' },
  { from: 'tropical', to: 'category', label: '度量空间 = 富集范畴' },
  { from: 'nim', to: 'category', label: '博弈与策略组成 Joyal 范畴' },
  { from: 'commutator', to: 'natural', label: '交换图 = 交换子为零' },
  { from: 'fourier', to: 'functor', label: 'Pontryagin 对偶是函子' },
];

export const nodeById = new Map(NODES.map(n => [n.id, n]));
export const isTrunk = node => !node.parent;
export const branchIds = NODES.filter(n => !isTrunk(n)).map(n => n.id);
