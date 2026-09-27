# learn-alongside

A learning repo: a family agenda app (subscriptions, recurring fruit purchases, family learning sessions) built step by step with pstack. The docs under `docs/` are in Chinese and are the main deliverable. Keep them in sync when behavior changes.

- `app/domain.js` is pure. All per-kind rules live in the `KINDS` registry. Due dates are derived from stored facts, never stored.
- `app/app.js` is the only place that touches the DOM or localStorage and the only place that parses form input (`PARSE`).
- Done means `npm run verify` prints `VERIFIED` (behavior tests, mutation check, Playwright e2e in Asia/Shanghai at 07:00).
- When you add a mutant-worthy rule to `domain.js`, add a line to `scripts/mutation-check.mjs`.
- Log decisions with `.claude/skills/show-me-your-work/scripts/log.sh decisions.tsv <phase> <decision> <why> <evidence> <result>`. Append only.
- pstack lives in `.claude/skills` (upstream backnotprop/pstack@157aae3). Fix pstack bugs upstream, not here.
- `category-film/` is an independent subproject (its own package.json, CLAUDE.md and `npm run verify`). Root verify does not cover it.
