# $root

Represents the root element of the current component (the element with `v-scope`).

## Usage

```html
<div v-scope>
  <button @click="console.log($root)">
    Log Component Root
  </button>
</div>
```
