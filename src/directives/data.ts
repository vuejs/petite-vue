import { reactive } from '@vue/reactivity'
import { evaluate } from '../eval'
import { Context } from '../app'

export function data(ctx: Context, exp: string): Context {
  const newScope = Object.create(ctx.scope)
  const ret = evaluate(ctx.scope, exp)
  return {
    ...ctx,
    scope: reactive(Object.assign(newScope, ret))
  }
}
