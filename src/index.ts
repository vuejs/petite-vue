export { createApp } from './app'
export { nextTick } from './scheduler'
export { reactive } from '@vue/reactivity'

import { createApp } from './app'

const s = document.currentScript
if (s && s.hasAttribute('init')) {
  createApp().mount()
}
