import { Context, Effect, Layer } from "effect"

class Http extends Context.Service<Http, {
  readonly get: (url: string) => Effect.Effect<string>
}>()("app/Http") {}

class Notifier extends Context.Service<Notifier, {
  readonly send: (text: string) => Effect.Effect<void>
}>()("app/Notifier") {}

class Weather extends Context.Service<Weather, {
  readonly today: Effect.Effect<"雨" | "晴">
}>()("app/Weather") {
  // 线上版：自己也有一个缺口，需要 Http
  static readonly live = Layer.effect(Weather, Effect.gen(function* () {
    const http = yield* Http
    const today = http.get("/weather").pipe(
      Effect.map((sky) => (sky === "rain" ? "雨" : "晴") as "雨" | "晴")
    )
    return Weather.of({ today })
  }))
  // 测试版：永远下雨
  static readonly test = Layer.succeed(Weather, Weather.of({ today: Effect.succeed("雨") }))
}

// Effect<string, never, Weather | Notifier>
export const remind = Effect.gen(function* () {
  const weather = yield* Weather
  const notifier = yield* Notifier
  const sky = yield* weather.today
  const text = sky === "雨" ? "下雨，记得带伞" : "晴天，不用带伞"
  yield* notifier.send(text)
  return text
})

export { Http, Notifier, Weather }
