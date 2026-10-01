import { Effect } from "effect"

// 普通 TypeScript：签名里看不出它会 throw
export const divideOrThrow = (a: number, b: number): number => {
  if (b === 0) throw new Error("Cannot divide by zero")
  return a / b
}

// Effect：失败写进了类型
export const divide = (
  a: number,
  b: number
): Effect.Effect<number, Error, never> =>
  b === 0
    ? Effect.fail(new Error("Cannot divide by zero"))
    : Effect.succeed(a / b)

Effect.runSync(divide(4, 2)) // 2
Effect.runSyncExit(divide(4, 0)) // Exit.fail(Error)
