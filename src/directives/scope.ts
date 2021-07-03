import { reactive } from '@vue/reactivity'
import { Context } from '../walk'

export const createScopedContext = (ctx: Context, data = {}): Context => {
  const parentScope = ctx.scope
  const mergedScope = Object.create(parentScope)
  Object.defineProperties(mergedScope, Object.getOwnPropertyDescriptors(data))
  mergedScope.$refs = Object.create(parentScope.$refs)
  const proxy = new Proxy(mergedScope, {
    set(target, key, val, receiver) {
      // when setting a property that doesn't exist on current scope,
      // do not create it on the current scope and fallback to parent scope.
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
