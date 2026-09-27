// 所有可调的旋钮都在这里。改完刷新页面即可，不需要动任何一幕的代码。
export const config = {
  lang: 'zh-CN',

  // 每一拍（beat）的时长由旁白字数推出：字数 / 语速 + 停顿，且不短于 minBeat 秒。
  // 某一拍写了 dur 就用 dur。改语速，整部片子的节奏一起变，动画和字幕不会错位。
  pace: { charsPerSecond: 4.6, pad: 1.1, minBeat: 3 },

  // 画布的逻辑尺寸。所有场景都按这个坐标系画，显示时整体缩放。
  stage: { width: 1920, height: 1080, fade: 0.6 },

  palette: {
    paper: '#f1eadb',
    ink: '#1f1c24',
    pencil: '#a79d8a',
    red: '#cf4128',
    yellow: '#eab52c',
    blue: '#2855b8',
    green: '#3a8656',
    violet: '#6a4799',
    ochre: '#c27527',
  },

  fonts: {
    serif: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", STSong, "WenQuanYi Zen Hei", serif',
    math: '"STIX Two Math", "Cambria Math", "Latin Modern Math", "Times New Roman", serif',
    mono: '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "WenQuanYi Zen Hei Mono", monospace',
  },

  // 播放器的初始状态。URL 参数（?prune=fourier,hackenbush&speed=1.25&t=90）会覆盖这里。
  defaults: { speed: 1, captions: true, voice: false, pruned: [] },
  speeds: [0.75, 1, 1.25, 1.5, 2],
};
