const evalCache: Record<string, Function> = Object.create(null)

export function evaluate(scope: any, exp: string, el?: Node) {
  const fn = evalCache[exp] || (evalCache[exp] = toFunction(exp))
  try {
    return fn(scope, el)
  } catch (e) {
    console.error(e)
  }
}

function toFunction(exp: string): Function {
  try {
    return new Function(`$scope`, `$el`, `with ($scope) { return (${exp}) }`)
  } catch (e) {
    console.error(`${e.message} in expression: ${exp}`)
    return () => {}
  }
}
