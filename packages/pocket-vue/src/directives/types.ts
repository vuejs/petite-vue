import type { Context } from '../context'
import type { effect as rawEffect } from '@vue/reactivity'

export interface Directive<T = Element> {
  (ctx: DirectiveContext<T>): (() => void) | void
}

export interface DirectiveContext<T = Element> {
  el: T
  get: (exp?: string) => any
  effect: typeof rawEffect
  exp: string
  arg?: string
  modifiers?: Record<string, true>
  ctx: Context
}
