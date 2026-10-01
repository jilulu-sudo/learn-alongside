// 可调的旋钮都在这里。改完刷新页面即可。
export const config = {
  lang: 'zh-CN',

  // 每一拍的时长 = 旁白字数 / 语速 + 停顿，且不短于 minBeat 秒。写了 dur 的拍用 dur。
  // 字母和符号按 latinWeight 个字计（代码标识符念起来比汉字快）。
  pace: { charsPerSecond: 4.6, latinWeight: 0.35, pad: 1.4, minBeat: 3.5 },

  // 回放真实记录时，屏幕上的 1 秒对应程序里的多少毫秒（测试时钟上的虚拟时间）。
  replay: { msPerSecond: 320, pad: 1.6 },

  // 画布的逻辑尺寸。所有场景都按这个坐标系画，显示时整体缩放。
  stage: { width: 1600, height: 900, fade: 0.5 },

  speeds: [0.75, 1, 1.25, 1.5, 2],
  defaults: { speed: 1, captions: true, voice: false },
};
