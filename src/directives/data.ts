import { reactive } from '@vue/reactivity'
import { isObject } from '@vue/shared'
import { evaluate } from '../eval'
import { Context } from '../walk'

export function data(ctx: Context, exp: string): Context {
  const ret = evaluate(ctx.scope, exp)
  if (isObject(ret)) {
    const newScope = Object.create(ctx.scope)
    return {
      ...ctx,
      scope: reactive(Object.assign(newScope, ret))
    }
  }
  return ctx
}
