import { Directive } from '.'

export const ref: Directive = ({
  el,
  ctx: {
    scope: { $refs }
  },
  get,
  effect
}) => {
  let prevRef: any
  effect(() => {
    const ref = get()
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
