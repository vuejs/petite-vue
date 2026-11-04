import type { Directive } from './types'

export const ref: Directive = ({
  el,
  ctx: {
    scope: { $refs }
  },
  get,
  effect,
  exp
}) => {
  let prevRef: any
  effect(() => {
    let ref = get()
    // If get() returns undefined and exp is a simple string, use exp directly
    if (ref === undefined && exp && !exp.includes('${') && !exp.includes('}')) {
      ref = exp
    }
    $refs[ref] = el
    if (prevRef && ref !== prevRef) {
      delete $refs[prevRef]
    }
    prevRef = ref
  })
  return () => {
    prevRef && delete $refs[prevRef]
  }
}
