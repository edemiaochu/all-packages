# @szewtwin/szewtwinui-variables

## Installation

```console
npm install @szewtwin/szewtwinui-variables
```

## Usage

Import in CSS:

```css
@import '@szewtwin/szewtwinui-variables';
```

Or in JS (if using a bundler):

```js
import '@szewtwin/szewtwinui-variables';
```

> **Note**: If your project doesn't support export maps, then you might need to import the css file explicitly:
>
> ```css
> @import '@szewtwin/szewtwinui-variables/index.css';
> ```

Specify a theme ("light" or "dark") by adding a `data-iui-theme` attribute to the top of your app.
```html
<body data-iui-theme="light">
  <!-- your application code -->
</body>
```

Now you can start using the variables:

```css
button {
  background-color: var(--iui-color-background);
  border: var(--iui-color-border);
  color: var(--iui-color-text);
}
```

You can also specify `data-iui-contrast` to switch to a high contrast version of the current theme.

```html
<body data-iui-theme="dark" data-iui-contrast="high">
  <!-- your application code -->
</body>
```

If you want the variables to automatically respect the user preferences (`prefers-color-scheme` and `prefers-contrast`), then you need to additionally import `os.css`, and use `data-iui-theme` without a value. For example:

```css
@import '@szewtwin/szewtwinui-variables';
@import '@szewtwin/szewtwinui-variables/os.css';
```
```html
<body data-iui-theme>
  <!-- your application code -->
</body>
```
