import { Data, Effect } from "effect"

class NotFound extends Data.TaggedError("NotFound") {}
class Timeout extends Data.TaggedError("Timeout") {}
class Unauthorized extends Data.TaggedError("Unauthorized") {}

type Happens = "ok" | "NotFound" | "Timeout" | "Unauthorized" | "bug"

export const fetchProfile = (
  happens: Happens
): Effect.Effect<string, NotFound | Timeout | Unauthorized> =>
  happens === "ok" ? Effect.succeed("Ada")
  : happens === "NotFound" ? Effect.fail(new NotFound())
  : happens === "Timeout" ? Effect.fail(new Timeout())
  : happens === "Unauthorized" ? Effect.fail(new Unauthorized())
  : Effect.die(new Error("profile is undefined")) // defect：不进类型

// 接回一条岔路，E 就窄一点
export const asGuest = (happens: Happens): Effect.Effect<string, Timeout | Unauthorized> =>
  fetchProfile(happens).pipe(
    Effect.catchTag("NotFound", () => Effect.succeed("访客"))
  )

// 全部接回，E = never；defect 仍然会穿过去
export const never = (happens: Happens): Effect.Effect<string, never> =>
  asGuest(happens).pipe(
    Effect.catchTag("Timeout", () => Effect.succeed("稍后再试")),
    Effect.catch((e) => Effect.succeed(`兜底：${e._tag}`))
  )
