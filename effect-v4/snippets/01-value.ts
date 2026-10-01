import { Effect } from "effect"

let count = 0

export const program = Effect.sync(() => ++count).pipe(
  Effect.map((n) => n * 10)
)
// 走到这里，count 仍然是 0：program 只是一张图纸

Effect.runSync(program) // 10，count = 1
Effect.runSync(program) // 20，count = 2

export const executions = () => count
