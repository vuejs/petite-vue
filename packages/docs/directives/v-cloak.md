# v-cloak

Used to hide un-compiled templates until the component instance is ready.

## Usage

```css
[v-cloak] {
  display: none !important;
}
```

```html
<div v-cloak>
  {{ message }}
</div>
```

> [!TIP]
> Adding `!important` ensures the rule isn't overridden by other styles.

## Details

This directive is only needed in no-build-step setups. When using pocket-vue directly in the browser, there might be a brief moment where the raw template (e.g. `{{ message }}`) is visible before pocket-vue compiles it.

`v-cloak` will remain on the element until the associated component instance finishes compilation. Combined with CSS rules such as `[v-cloak] { display: none }`, this directive can be used to hide un-compiled bindings until the component instance is ready.
