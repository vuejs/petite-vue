import type { Directive } from './types'
import { bind } from './bind'
import { on } from './on'
import { show } from './show'
import { text } from './text'
import { html } from './html'
import { model } from './model'
import { effect } from './effect'
import { ref } from './ref'

export type { Directive }

export const builtInDirectives: Record<string, Directive<any>> = {
  bind,
  on,
  show,
  text,
  html,
  model,
  effect,
  ref
}
