import { validateExpression } from './evalValidate'

const evalCache: Record<string, Function> = Object.create(null)

export const evaluate = (scope: object, exp: string, el: Element) => {
  if (!validateExpression(exp)) {
    if (import.meta.env.DEV) {
      console.warn(`Potentially unsafe expression rejected: "${exp}"`)
    }
    return undefined
  }

  try {
    const fn = evalCache[exp] ?? (evalCache[exp] = new Function('$el', `with (this) { return (${exp}) }`))
    return fn.call(scope, el)
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error(`Error evaluating expression "${exp}":`, e)
    }
    return undefined
  }
}

export const execute = (scope: any, exp: string, el?: Node) => {
  if (!validateExpression(exp)) {
    if (import.meta.env.DEV) {
      console.warn(`Potentially unsafe expression rejected: "${exp}"`)
    }
    return undefined
  }

  const fn = evalCache[exp] ?? (evalCache[exp] = toFunction(exp))
  try {
    return fn(scope, el)
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error(`Error executing expression "${exp}":`, e)
    }
    // Remove from cache on error to prevent future failures
    delete evalCache[exp]
    return undefined
  }
}

const toFunction = (exp: string): Function => {
  try {
    return new Function(`$data`, `$el`, `with($data){${exp}}`)
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error(`Invalid expression: ${exp}`, e)
    }
    return () => { }
  }
}
