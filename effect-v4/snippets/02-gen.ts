import { Data, Effect } from "effect"

class ParseError extends Data.TaggedError("ParseError")<{ input: string }> {}
class UserNotFound extends Data.TaggedError("UserNotFound")<{ id: number }> {}

const users = new Map([[42, "Ada"]])

const parse = Effect.fn("parse")(function* (input: string) {
  const id = Number(input)
  if (!Number.isInteger(id)) return yield* new ParseError({ input })
  return id
})

const findUser = Effect.fn("findUser")(function* (id: number) {
  const name = users.get(id)
  if (name === undefined) return yield* new UserNotFound({ id })
  return name
})

export const greetUser = Effect.fn("greetUser")(function* (input: string) {
  const id = yield* parse(input)
  const name = yield* findUser(id)
  return `你好，${name}`
})

// 类型由编译器推出，写出来只为看清楚
export const ada: Effect.Effect<string, ParseError | UserNotFound, never> =
  greetUser("42")
