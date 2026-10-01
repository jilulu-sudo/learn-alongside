import { Console, Effect } from "effect"

// 拿的同时登记怎么还：还的动作交给 Scope 保管
const open = (thing: string) =>
  Effect.acquireRelease(
    Console.log(`开${thing}`),
    () => Console.log(`关${thing}`)
  )

export const home = Effect.scoped(
  Effect.gen(function* () {
    yield* open("门")
    yield* open("灯")
    yield* open("窗")
    yield* Effect.sleep("300 millis") // 在家待一会儿
  })
)
// 开门 开灯 开窗 … 关窗 关灯 关门：后拿的先还
