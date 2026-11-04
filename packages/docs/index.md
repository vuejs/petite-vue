---
layout: home

hero:
  name: "Pocket Vue"
  image: { src: '/logo.jpg', alt: 'pocket-vue logo' }
  text: "Progressive Enhancement for the Modern Web"
  tagline: A lightweight, Vue-compatible library optimized for "sprinkling" interactions on server-rendered pages (Django, Laravel, Rails, and more).
  actions:
    - theme: brand
      text: Get Started
      link: /start-here/installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/ws-rush/pocket-vue

features:
  - title: Ultra Lightweight
    details: Only ~9kb gzipped. No build step required. Just drop it in and go. Perfect for "sprinkling" on existing pages.
  - title: Progressive First
    details: Designed specifically for progressive enhancement. Layer on interactivity without rewriting your server-rendered HTML.
  - title: Vue Compatible
    details: Uses the same template syntax and reactivity system as standard Vue. Leverage your existing Vue knowledge.
  - title: Framework Friendly
    details: Works seamlessly with Django, Rails, Laravel, and ASP.NET. Replace complex jQuery or vanilla JS with ease.
---

<div style="text-align: center; margin-top: 40px;">

## Why pocket-vue?

pocket-vue is a fork of petite-vue, providing a modern, maintained solution for developers who want the power of Vue's reactivity without the overhead of a full Single Page Application (SPA).

```html
<!-- No build step required! -->
<script src="https://unpkg.com/pocket-vue" defer init></script>

<div v-scope="{ count: 0 }">
  {{ count }}
  <button @click="count++">Increment</button>
</div>
```

</div>
