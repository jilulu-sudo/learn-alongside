// 六：服务与 Layer。运行 snippets/06-layers.ts 的 remind，用里面定义的 Weather.live / Weather.test；
// Http 和 Notifier 的实现在这里给出（演示用，不联网）。
import { Effect, Layer } from 'effect';
import { Http, Notifier, Weather, remind } from '../../snippets/06-layers.ts';
import { recordSync } from '../effect/record.js';

export const lab = {
  knobs: [
    { id: 'weather', label: 'Weather 用哪块料', options: [{ value: 'live', label: 'Weather.live' }, { value: 'test', label: 'Weather.test' }] },
    { id: 'http', label: '给 Weather.live 提供 Http', options: [{ value: true, label: '提供' }, { value: false, label: '忘了' }] },
  ],
  defaults: { weather: 'live', http: true },
  async run({ weather, http }) {
    // “换一块料”那一拍要并排比较，所以线上版和测试版也各跑一遍。
    return { yours: wire(weather, http), live: wire('live', true), test: wire('test', true) };
  },
};

function wire(weather, http) {
  const sent = [];
  const calls = [];
  const r = recordSync(() => {
    const notifier = Layer.succeed(Notifier, Notifier.of({ send: text => Effect.sync(() => void sent.push(text)) }));
    const httpDemo = Layer.succeed(Http, Http.of({ get: url => Effect.sync(() => (calls.push(url), 'sunny')) }));
    const weatherLayer = weather === 'test' ? Weather.test : http ? Weather.live.pipe(Layer.provide(httpDemo)) : Weather.live;
    return remind.pipe(Effect.provide(Layer.merge(weatherLayer, notifier)));
  });
  const missing = weather === 'live' && !http ? ['Http'] : [];
  return { exit: r.exit, sent, calls, missing };
}
