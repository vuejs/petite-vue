# v-pre

Skip compilation for this element and all its children.

## Usage

```html
<span v-pre>{{ this will not be compiled }}</span>
```

## Details

Inside the element with `v-pre`, all pocket-vue syntax (mustache tags, directives) will be ignored and rendered as-is. This is useful for displaying raw mustache tags.
