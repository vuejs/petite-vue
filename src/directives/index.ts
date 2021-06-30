import { Context } from '../app'
import { effect } from '@vue/reactivity'
import { _if } from './if'
import { _for } from './for'
import { bind } from './bind'
import { on } from './on'
import { show } from './show'
import { text } from './text'
import { html } from './html'
import { model } from './model'

export type Directive<T = Element> = (
  ctx: DirectiveContext<T>
) => (() => void) | void

export interface DirectiveContext<T = Element> {
  el: T
  get: (exp?: string) => any
  effect: typeof effect
  exp: string
  arg?: string
  modifiers?: Record<string, true>
  ctx: Context
}

export const builtInDirectives = {
  if: _if,
  for: _for,
  bind,
  on,
  show,
  text,
  html,
  model
}
