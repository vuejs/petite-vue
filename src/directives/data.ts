import { reactive } from '@vue/reactivity'
import { isObject } from '@vue/shared'
import { evaluate } from '../eval'
import { Context } from '../walk'

export function data(ctx: Context, exp: string): Context {
  const parentScope = ctx.scope
  const childScope = evaluate(parentScope, exp)
  if (isObject(childScope)) {
    const mergedScope = Object.assign(Object.create(parentScope), childScope)
    const proxy = new Proxy(mergedScope, {
      set(target, key, val, receiver) {
        if (receiver === reactiveProxy && !target.hasOwnProperty(key)) {
          return Reflect.set(parentScope, key, val)
        }
        return Reflect.set(target, key, val, receiver)
      }
    })
    const reactiveProxy = reactive(proxy)
    return {
      ...ctx,
      scope: reactiveProxy
    }
  }
  return ctx
}
