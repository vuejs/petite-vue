import type { Directive } from './types'
import { getElementMetadata } from '../metadata'

/**
 * v-show directive implementation
 * Uses WeakMap-based metadata storage for automatic memory cleanup
 */
export const show: Directive<HTMLElement> = ({ el, get, effect }) => {
  // Store original display value in metadata (WeakMap)
  // This will be automatically garbage collected when the element is removed
  const metadata = getElementMetadata(el)
  if (metadata.originalDisplay === undefined) {
    metadata.originalDisplay = el.style.display || ''
  }

  effect(() => {
    const shouldShow = get()
    el.style.display = shouldShow ? metadata.originalDisplay! : 'none'
  })
}
