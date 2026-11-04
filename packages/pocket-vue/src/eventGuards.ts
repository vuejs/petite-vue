import { hyphenate } from '@vue/shared'

const systemModifiers = ['ctrl', 'shift', 'alt', 'meta']

type KeyedEvent = KeyboardEvent | MouseEvent | TouchEvent

const modifierGuards: Record<
  string,
  (e: Event, modifiers: Record<string, true>) => void | boolean
> = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !(e as KeyedEvent).ctrlKey,
  shift: (e) => !(e as KeyedEvent).shiftKey,
  alt: (e) => !(e as KeyedEvent).altKey,
  meta: (e) => !(e as KeyedEvent).metaKey,
  left: (e) => 'button' in e && (e as MouseEvent).button !== 0,
  middle: (e) => 'button' in e && (e as MouseEvent).button !== 1,
  right: (e) => 'button' in e && (e as MouseEvent).button !== 2,
  exact: (e, modifiers) =>
    systemModifiers.some((m) => (e as any)[`${m}Key`] && !modifiers[m])
}

export const mapClickArg = (arg: string, modifiers?: Record<string, true>) => {
  if (arg === 'click' && modifiers) {
    if (modifiers.right) return 'contextmenu'
    if (modifiers.middle) return 'mouseup'
  }
  return arg
}

export const applyModifiers = (
  raw: Function,
  modifiers: Record<string, true>
) => {
  return (e: Event) => {
    if ('key' in e && !(hyphenate((e as KeyboardEvent).key) in modifiers)) {
      return
    }
    for (const key in modifiers) {
      const guard = modifierGuards[key]
      if (guard?.(e, modifiers)) {
        return
      }
    }
    return raw(e)
  }
}
