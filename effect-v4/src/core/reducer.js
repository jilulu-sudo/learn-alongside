// 播放器的全部状态变化。knobs 是旋钮上显示的参数（用户刚拨的），runs 是已经真实跑完的参数与记录。
// 画面只用 runs：参数和记录总是成对出现，不会出现“新参数配旧记录”的一帧。
export const keyOf = params => JSON.stringify(params);

export function initialState({ chapters, labs, defaults }, boot = {}) {
  const knobs = Object.fromEntries(chapters.map(id => [id, { ...labs[id].defaults, ...(boot.knobs?.[id] ?? {}) }]));
  return {
    chapter: boot.chapter && chapters.includes(boot.chapter) ? boot.chapter : chapters[0],
    t: boot.t ?? 0,
    playing: false,
    started: Boolean(boot.chapter),
    speed: defaults.speed,
    captions: defaults.captions,
    voice: defaults.voice,
    knobs,
    runs: {},
    replay: {},
  };
}

export function makeReducer({ chapters, timelineOf, replayBeat }) {
  const total = state => timelineOf(state, state.chapter)?.total ?? 0;
  const clampT = (state, t) => Math.min(total(state), Math.max(0, t));

  return function reducer(state, action) {
    switch (action.type) {
      case 'tick': {
        const end = total(state);
        if (!state.playing || end === 0) return state;
        const t = state.t + action.dt * state.speed;
        return t >= end ? { ...state, t: end, playing: false } : { ...state, t };
      }
      case 'play':
        return { ...state, started: true, playing: true, t: state.t >= total(state) ? 0 : state.t };
      case 'pause':
        return { ...state, playing: false };
      case 'toggle':
        return reducer(state, { type: state.playing ? 'pause' : 'play' });
      case 'seek':
        return { ...state, started: true, t: clampT(state, action.t) };
      case 'step':
        return { ...state, started: true, t: clampT(state, action.to) };
      case 'go': {
        if (!chapters.includes(action.chapter)) return state;
        return { ...state, chapter: action.chapter, t: 0, started: true, playing: action.play ?? true };
      }
      case 'next': {
        const i = chapters.indexOf(state.chapter);
        return i < chapters.length - 1 ? reducer(state, { type: 'go', chapter: chapters[i + 1] }) : state;
      }
      case 'knob': {
        const knobs = { ...state.knobs, [action.chapter]: { ...state.knobs[action.chapter], [action.id]: action.value } };
        return { ...state, knobs, replay: { ...state.replay, [action.chapter]: true } };
      }
      case 'ran': {
        // 旋钮已经拨到别处：这份记录过时了。已经有画面可放时就丢掉它，等新的记录。
        const current = keyOf(state.knobs[action.chapter]) === keyOf(action.params);
        if (!current && state.runs[action.chapter]) return state;
        const runs = { ...state.runs, [action.chapter]: { params: action.params, trace: action.trace } };
        const next = { ...state, runs };
        if (!current || !state.replay[action.chapter]) return next;
        const replay = { ...state.replay, [action.chapter]: false };
        if (action.chapter !== state.chapter) return { ...next, replay };
        const beat = replayBeat(action.chapter);
        if (!beat) return { ...next, replay };
        const timeline = timelineOf(next, action.chapter);
        const start = timeline.beats.find(b => b.id === beat)?.start ?? 0;
        return { ...next, replay, t: start, playing: true, started: true };
      }
      case 'speed':
        return { ...state, speed: action.speed };
      case 'captions':
        return { ...state, captions: !state.captions };
      case 'voice':
        return { ...state, voice: !state.voice };
      default:
        return state;
    }
  };
}
