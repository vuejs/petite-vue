# Plugins

Plugins are self-contained code that usually add global-level functionality to pocket-vue.

## Using a Plugin

```js
import { createApp } from 'pocket-vue'
import myPlugin from './my-plugin'

createApp().use(myPlugin, {
  /* options */
}).mount()
```

## Writing a Plugin

A plugin is an object with an `install` method:

```js
export default {
  install: (app, options) => {
    // add a global directive
    app.directive('my-directive', (ctx) => {
      // ...
    })
  }
}
```

## Example

```html
<div v-scope="{counter: 0}" v-log="inside pocket-vue scope">
  <button @click="counter++">increase</button>
</div>

<script type="module">
  import log from './log.js'
  import { createApp } from 'pocket-vue'
  createApp().use(log).mount()
</script>
```

```js
// log.js
export default {
  install: (app, options) => {
    app.directive('log', ({exp}) => {
      console.log(exp)
    })
  }
}
```
