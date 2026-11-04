# v-html

`v-html` is used to update an element's `innerHTML`.

## Basic Usage

```html
<div v-scope="{ rawHtml: '<h1>Header</h1>' }">
  <div v-html="rawHtml"></div>
</div>
```

---

## Security Warning: XSS Risks

> [!WARNING] SECURITY RISK
> Dynamically rendering arbitrary HTML on your website is **extremely dangerous** and is a primary cause of Cross-Site Scripting (XSS) vulnerabilities.

### Important Rules:
1.  **NEVER** use `v-html` on content provided by users (e.g., from an input field or a public API).
2.  **ONLY** use `v-html` on trusted content from your own backend that has been properly sanitized.
3.  **Prefer `v-text`** or mustache syntax whenever possible. Only use `v-html` if you specifically need to render HTML formatting.

---

## Use Cases

`v-html` is typically used for rendering content from a CMS or a Markdown parser where the HTML structure is already determined and trusted.

```html
<div v-scope="{ postContent: '<p>This is my post <em>body</em></p>' }">
  <article v-html="postContent"></article>
</div>
```

---

## Behavior

`v-html` works by setting the element's `innerHTML` property. This means all existing children in the element will be completely overwritten.

### Integration with Other Directives
Directives and interpolations inside the HTML string provided to `v-html` will **not** be compiled by pocket-vue. If you need to render dynamic templates, you should use regular Vue components or server-side rendering.
