# Laravel Integration Guide

pocket-vue is an excellent alternative or companion to Livewire or Alpine.js in Laravel applications. It provides the same reactive benefits without the server-side overhead of Livewire.

## Installation

Add pocket-vue to your `app.blade.php` layout.

```html
<!-- resources/views/layouts/app.blade.php -->
<head>
  <script src="https://unpkg.com/pocket-vue" defer init></script>
</head>
```

---

## Data Injection

Laravel provides the `Js::from()` directive to safely serialize data into your Blade templates.

### In your Blade View:

```blade
<div v-scope="{ 
  user: {{ Js::from($user) }},
  notifications: {{ Js::from($notifications) }}
}">
  <h1>Welcome, @{{ user.name }}</h1>
</div>
```

> [!TIP]
> Use the `@` prefix to escape Blade's mustache syntax (`@{{ }}`) so that pocket-vue can process it on the client.

---

## CSRF Token Handling

Laravel automatically includes a CSRF token. pocket-vue can read this for all AJAX requests.

### Option 1: Meta Tag Extraction

```javascript
function postData() {
  const token = document.querySelector('meta[name="csrf-token"]').content
  fetch('/api/v1/posts', {
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(this.postData)
  })
}
```

---

## Practical Examples

### 1. Livewire-like Table Search
Build a fast, client-side table search without an extra round-trip to the server.

```blade
<div v-scope="{ query: '', posts: {{ Js::from($posts) }} }">
  <input v-model="query" placeholder="Search posts...">
  
  <table>
    <tr v-for="post in posts" v-show="post.title.toLowerCase().includes(query.toLowerCase())">
      <td>@{{ post.title }}</td>
    </tr>
  </table>
</div>
```

### 2. Real-time Notifications
Easily manage a list of notifications from a WebSocket (like Laravel Echo).

```html
<!-- Echo implementation example -->
<div v-scope="{ notifications: [] }" @vue:mounted="setupEcho()">
  <!-- notifications list -->
</div>

<script>
createApp({
  notifications: [],
  setupEcho() {
    Echo.channel('notifications')
        .listen('NewNotification', (e) => {
          this.notifications.push(e.message)
        })
  }
}).mount()
</script>
```

---

## Comparison with Alpine.js

Laravel developers often use Alpine.js. Here is how pocket-vue compares:

| Feature | pocket-vue | Alpine.js |
|---------|-----------|-----------|
| **Syntax** | Vue-compatible (`v-if`, `v-for`) | Custom (`x-if`, `x-for`) |
| **Reactivity** | Full Vue reactivity | Internal reactive engine |
| **Directives** | ~16 directives | ~15 directives |
| **Learning Curve** | Low (if you know Vue) | Low |

---

## Blade Conflicts

If you find yourself constantly escaping mustaches with `@{{ }}`, you can change pocket-vue's delimiters.

```javascript
createApp({
  $delimiters: ['[[', ']]']
}).mount()
```

Blade template:
```html
<p>[[ message ]]</p>
```
