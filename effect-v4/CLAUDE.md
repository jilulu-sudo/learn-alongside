# effect-v4

《一根线》：an interactive, in-browser explainer of Effect v4 (`effect@4.0.0-rc.118`), built with Vite + React + SVG. Independent of the family-agenda app at the repo root and of `category-film/`. Docs (`README.md`, `docs/`) are in Chinese and are the main deliverable; keep them in sync when scenes, labs or behavior change.

- Every timeline on screen is a replay of a real Effect run. Labs (`src/labs/`) run real Effect programs (on `TestClock` when time matters) through `src/effect/record.js` and return plain data; scenes only replay that data. Never hand-draw a timing, an Exit or a span that a lab could record.
- A frame is a pure function: `Stage(scene, timeline, { params, trace }, t)`. `View({ clock, params, trace })` may not use `Date`, `Math.random`, module-level mutable state or React state.
- Code shown on screen lives in `snippets/*.ts`, is type-checked by `tsc` against the pinned `effect` version, and is executed by tests or labs. Beat `hl` anchors must match a line in the chapter's snippet (tested).
- All demo durations are multiples of the recorder's 10ms step, so recorded times are exact.
- Side effects (rAF, keyboard, running labs, URL, speech) live only in `src/player/effects.js`.
- Done means `npm run verify` prints `VERIFIED` (tsc, Vitest, build, Playwright smoke).
- Log decisions with `../.claude/skills/show-me-your-work/scripts/log.sh decisions.tsv <phase> <decision> <why> <evidence> <result>`. Append only.
