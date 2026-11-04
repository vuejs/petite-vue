# v-once

Render the element and component once only.

## Usage

```html
<span v-once>This will never change: {{ msg }}</span>
```

## Details

On subsequent re-renders, the element/component and all its children will be treated as static content and skipped. This can be used to optimize update performance.
