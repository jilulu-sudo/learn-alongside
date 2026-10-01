import { Cause, Data, Effect, Schedule } from "effect"

class Flaky extends Data.TaggedError("Flaky") {}

let attempts = 0

// 每次请求要 100ms，前三次失败
const request = Effect.gen(function* () {
  attempts++
  yield* Effect.sleep("100 millis")
  if (attempts < 4) return yield* new Flaky()
  return `第 ${attempts} 次成功`
})

export const program: Effect.Effect<string, Flaky | Cause.TimeoutError> =
  request.pipe(
    Effect.retry({
      schedule: Schedule.exponential("100 millis"), // 等 100、200、400…
      times: 5
    }),
    Effect.timeout("2 seconds")
  )
