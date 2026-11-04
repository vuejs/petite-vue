# Rails Integration Guide

pocket-vue works exceptionally well with Ruby on Rails, providing a lightweight alternative or supplement to Stimulus and Turbo.

## Installation

The quickest way is via CDN in your `application.html.erb` layout.

```html
<!-- app/views/layouts/application.html.erb -->
<head>
  <script src="https://unpkg.com/pocket-vue" defer init></script>
</head>
```

---

## Data Injection

Rails provides several ways to pass data to your views.

### In your Controller:

```ruby
def index
  @users = User.all.to_json
end
```

### In your ERB View:

Inject the data directly into `v-scope`.

```html
<div v-scope="{ users: <%= @users %> }">
  <div v-for="user in users">
    <%= link_to 'Show', user_path(@user) %> - {{ user.name }}
  </div>
</div>
```

---

## CSRF Protection

Rails includes a CSRF token in a meta tag by default. pocket-vue can easily read this for AJAX requests.

### Option 1: Reading Meta Tag

```javascript
function submitPost() {
  const token = document.querySelector('meta[name="csrf-token"]').content
  fetch('/posts', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(this.postData)
  })
}
```

---

## Integration with Turbo

If you are using Hotwire (Turbo), remember that Turbo replaces the `<body>` but doesn't perform a full page reload.

### Handling Turbo Page Loads
You may need to re-initialize pocket-vue after a Turbo navigation.

```javascript
document.addEventListener('turbo:load', () => {
  PocketVue.createApp().mount()
})
```

---

## Practical Examples

### 1. Interactive Search Filter
Use pocket-vue to filter a list of items fetched from Rails.

```html
<div v-scope="{ 
  query: '', 
  items: <%= @items.to_json %> 
}">
  <input type="text" v-model="query" placeholder="Search...">
  <ul>
    <li v-for="item in items" v-show="item.name.toLowerCase().includes(query.toLowerCase())">
      {{ item.name }}
    </li>
  </ul>
</div>
```

### 2. Form with Dynamic Fields
Easily add or remove nested form fields.

```html
<div v-scope="{ 
  fields: [{ id: 1, name: '' }] 
}">
  <div v-for="(field, index) in fields">
    <input type="text" :name="'user[tasks_attributes][' + index + '][name]'" v-model="field.name">
    <button type="button" @click="fields.splice(index, 1)">Remove</button>
  </div>
  <button type="button" @click="fields.push({ id: Date.now(), name: '' })">Add Task</button>
</div>
```

---

## ERB Conflict Handling

Rails uses `<%= %>` which doesn't conflict with pocket-vue's `{{ }}`. However, you might want to use different delimiters for clarity.

### Changing pocket-vue Delimiters

```javascript
createApp({
  $delimiters: ['[[', ']]']
}).mount()
```

ERB View:
```html
<p>[[ rails_data_in_pico_vue ]]</p>
```
