import { reactive } from '@vue/reactivity'
import { isObject } from '@vue/shared'
import { Context } from '../walk'

export const createScopedContext = (ctx: Context, data: object): Context => {
  if (isObject(data)) {
    const parentScope = ctx.scope
    const mergedScope = Object.assign(Object.create(parentScope), data)
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
