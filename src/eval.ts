const evalCache: Record<string, Function> = Object.create(null)

export function evaluate(scope: any, exp: string, el?: Node) {
  const fn =
    evalCache[exp] ||
    (evalCache[exp] = new Function(
      `__scope`,
      `$el`,
      `with (__scope) { return (${exp}) }`
    ))
  return fn(scope, el)
}
