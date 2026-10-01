// v4：一个包、一个版本号。HTTP、SQL、CLI、AI、工作流都在 effect 里。
// rc.118 起它们从 "effect/unstable/*" 搬到了 "effect/*"。
import { Config, Effect, Layer, Schedule, Schema, Stream } from "effect"
import { HttpClient } from "effect/http"
import { SqlClient } from "effect/sql"
import { Command } from "effect/cli"
import { LanguageModel } from "effect/ai"
import { Workflow } from "effect/workflow"

// 同一根线上叠能力：每一行都是一个算子，不是一套新架构
export const resilient = <A, E, R>(request: Effect.Effect<A, E, R>) =>
  request.pipe(
    Effect.retry({ schedule: Schedule.exponential("100 millis"), times: 3 }),
    Effect.timeout("2 seconds"),
    Effect.withSpan("resilient")
  )

export const modules = { Config, Layer, Schema, Stream, HttpClient, SqlClient, Command, LanguageModel, Workflow }
