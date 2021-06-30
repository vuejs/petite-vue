import { reactive } from '@vue/reactivity'
import { evaluate } from '../eval'
import { AppContext } from '../app'

export function data(ctx: AppContext, exp: string): AppContext {
  const newScope = Object.create(ctx.scope)
  const ret = evaluate(ctx.scope, exp)
  return {
    ...ctx,
    scope: reactive(Object.assign(newScope, ret))
  }
}
