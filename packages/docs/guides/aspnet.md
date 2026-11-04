# ASP.NET Core Integration Guide

pocket-vue is an excellent choice for ASP.NET developers who want a lightweight way to add interactivity to their Razor views or pages without using a full-blown SPA.

## Installation

Add pocket-vue to your `_Layout.cshtml` file.

```html
<!-- Views/Shared/_Layout.cshtml -->
<head>
  <script src="https://unpkg.com/pocket-vue" defer init></script>
</head>
```

---

## Data Injection

Serializing C# objects to JSON and injecting them into your Razor views is simple using `JsonSerializer`.

### In your Controller:

```csharp
public IActionResult Profile()
{
    var userData = new {
        Username = User.Identity.Name,
        IsPremium = true,
        LastLogin = DateTime.Now
    };
    ViewBag.UserJson = System.Text.Json.JsonSerializer.Serialize(userData);
    return View();
}
```

### In your Razor View:

Use `@Html.Raw()` to output the JSON string directly into `v-scope`.

```html
<div v-scope="@Html.Raw(ViewBag.UserJson)">
  <p>Welcome, {{ Username }}</p>
  <p v-if="IsPremium">You are a premium member!</p>
</div>
```

---

## Antiforgery Tokens (CSRF)

ASP.NET Core requires an antiforgery token for POST/PUT/DELETE requests.

### Option 1: Reading from Meta Tag
Add a meta tag with the antiforgery token to your `_Layout.cshtml`:

```html
<meta name="X-XSRF-TOKEN" content="@Html.AntiForgeryToken()">
```

Then access it in your pocket-vue methods:

```javascript
function saveData() {
  const token = document.querySelector('meta[name="X-XSRF-TOKEN"]').content
  fetch('/api/save/', {
    method: 'POST',
    headers: {
      'RequestVerificationToken': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(this.formData)
  })
}
```

---

## Practical Examples

### 1. Progressive Form Validation
Enhance your ASP.NET forms with real-time validation.

```html
<form method="post" v-scope="{ 
  username: '',
  get isValid() { return this.username.length >= 5 }
}">
  @Html.AntiForgeryToken()
  <input type="text" name="Username" v-model="username" />
  <span v-show="username && !isValid" class="text-danger">
    Username must be at least 5 characters.
  </span>
  <button :disabled="!isValid" type="submit">Submit</button>
</form>
```

### 2. Dynamic Table Row Addition
Easily manage dynamic form sections where users can add or remove items.

```html
<div v-scope="{ 
  items: [{ description: '', amount: 0 }] 
}">
  <table class="table">
    <tr v-for="(item, index) in items">
      <td><input type="text" :name="'Items[' + index + '].Description'" v-model="item.description" /></td>
      <td><input type="number" :name="'Items[' + index + '].Amount'" v-model="item.amount" /></td>
      <td><button type="button" @click="items.splice(index, 1)">Remove</button></td>
    </tr>
  </table>
  <button type="button" @click="items.push({ description: '', amount: 0 })">Add Row</button>
</div>
```

---

## Handling Razor Conflicts

Razor uses the `@` symbol, which pocket-vue also uses for its event shorthand (`@click`).

### Escaping `@`
You can escape the `@` symbol in your Razor views by using `@@`.

```html
<button @@click="increment">+</button>
```

---

## Changing pocket-vue Delimiters

If you'd like to use different delimiters to avoid confusion with Razor:

```javascript
createApp({
  $delimiters: ['[[', ']]']
}).mount()
```

Razor View:
```html
<p>[[ my_data_from_server ]]</p>
```
