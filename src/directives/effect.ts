import { Directive } from '.'

export const effect: Directive = ({ get, effect }) => {
  effect(get)
}
