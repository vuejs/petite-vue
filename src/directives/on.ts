import { Directive } from '.'

// same as vue 2
const simplePathRE =
  /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/

export const on: Directive = ({ el, get, exp, arg, modifiers }) => {
  const handler = simplePathRE.test(exp)
    ? get(`(e => ${exp}(e))`)
    : get(`($event => { ${exp} })`)
  // TODO more modifiers
  el.addEventListener(arg, handler, modifiers)
}
