# category-film

An in-browser explainer film (Vite + React + SVG) about semigroups, Möbius/Fourier, tropical algebra, combinatorial games and category theory. Independent of the family-agenda app at the repo root. Docs (`README.md`, `docs/`) are in Chinese and are the main deliverable; keep them in sync when scenes or behavior change.

- A frame is a pure function of time: `Stage(timeline, t)`. Scenes export `{ beats, View }`; `View({ clock })` may only depend on `clock` (no `Date`, no `Math.random`, no state). Use seeded noise from `src/paint/brush.js`.
- Structure lives in `src/core/graph.js` (`NODES` order = play order, `parent` = branch). A beat that mentions a branch must declare `needs: [branchId]`.
- Numbers shown on screen come from `src/math/` and are proven in `test/math.test.js`.
- Side effects (rAF, keyboard, URL, speech) live only in `src/player/effects.js`.
- Done means `npm run verify` prints `VERIFIED` (Vitest, build, Playwright smoke).
- Log decisions with `../.claude/skills/show-me-your-work/scripts/log.sh decisions.tsv <phase> <decision> <why> <evidence> <result>`. Append only.
