import { Directive } from '.'
import { execute } from '../eval'
import { nextTick } from '../scheduler'

export const effect: Directive = ({ el, ctx, exp, effect }) => {
  nextTick(() => effect(() => execute(ctx.scope, exp, el)))
}
