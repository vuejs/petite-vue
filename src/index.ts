export { createApp } from './app'
export { nextTick } from './scheduler'
export { reactive } from '@vue/reactivity'

import { createApp } from './app'

let s
if ((s = document.currentScript) && s.hasAttribute('init')) {
  createApp().mount()
}
