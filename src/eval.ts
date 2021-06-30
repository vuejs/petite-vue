const evalCache: Record<string, Function> = Object.create(null)

export function evaluate(scope: any, exp: string, el?: Node) {
  const fn =
    evalCache[exp] ||
    (evalCache[exp] = new Function(
      `__scope`,
      `$el`,
      `with (__scope) { return (${exp}) }`
    ))
  try {
    return fn(scope, el)
  } catch (e) {
    console.error(e)
  }
}
