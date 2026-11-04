# v-text

`v-text` updates the element's text content. It is a one-way binding from a reactive property to the DOM.

## Basic Usage

```html
<div v-scope="{ msg: 'Hello' }">
  <span v-text="msg"></span>
</div>
```

---

## Comparison with Mustache Syntax

`v-text` is equivalent to using mustache interpolations (`{{ }}`).

```html
<span v-text="msg"></span>
<!-- is the same as -->
<span>{{ msg }}</span>
```

### Why use `v-text`?
While mustache syntax is generally more flexible, `v-text` can be useful in specific cases:

1.  **Avoiding FOUC**: When using mustache syntax, the raw `{{ msg }}` may be visible for a split second before pocket-vue initializes. Using `v-text` on an empty element avoids this flash of uncompiled content (you can also use `v-cloak` to solve this).
2.  **Overwriting Content**: `v-text` will completely overwrite all children inside the target element, whereas mustache syntax allows you to combine static text and reactive data within a single element.

---

## Details

`v-text` works by setting the element's `textContent` property. This means all values are treated as plain text and will not be interpreted as HTML.

```html
<div v-scope="{ msg: '<b>Bold</b>' }">
  <!-- Renders as: &lt;b&gt;Bold&lt;/b&gt; -->
  <span v-text="msg"></span>
</div>
```
