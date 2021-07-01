export { createApp } from './app'
export { reactive, effect } from '@vue/reactivity'

import { createApp } from './app'

let s
if ((s = document.currentScript) && s.hasAttribute('init')) {
  createApp().mount()
}
