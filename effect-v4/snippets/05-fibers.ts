import { Effect } from "effect"

// 一个任务：睡 ms 毫秒，然后交出自己的编号
const task = (n: number, ms: number) => Effect.sleep(ms).pipe(Effect.as(n))

const tasks = [task(1, 200), task(2, 100), task(3, 210), task(4, 110), task(5, 150)]

export const sequential = Effect.all(tasks) // 一根接一根：770ms

export const bounded = Effect.all(tasks, { concurrency: 2 }) // 最多两根：460ms

export const unbounded = Effect.all(tasks, { concurrency: "unbounded" }) // 210ms

// 赛跑：先到的赢，另一根当场被中断
export const fastest = Effect.race(task(1, 200), task(2, 100)) // 2
