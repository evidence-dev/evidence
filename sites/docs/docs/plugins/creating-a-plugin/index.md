# Creating a Plugin

## Initializing your Plugin

Writing a components plugin is very similar to creating a SvelteKit library

Start by initializing a library:

```bash
npm create svelte
```

Next, open `package.json`, and add the following flag; this tells evidence that your package is a component plugin.

```json
"evidence": {
    "components": true
}
```

## Exporting Components

There are 2 ways to expose components to Evidence, `evidence.manifest.yaml`, and module exports.
For both methods, you must re-export the components in your `index.js` file, and they must
have the same export name as the svelte file name. (e.g. `MyComponent.svelte` must be exported as `MyComponent`)

### Module Exports

When writing a plugin from scratch, this is the preferred method.
To indicate that a component should be available in Evidence implicitly (e.g. without imports),
add the following to your component:

```html
<script context="module">
    export const evidenceInclude = true;
</script>
```

### Manifest

If you would prefer not to flag your components, you can also maintain a `evidence.manifest.yaml` file.
The structure of the file is a single array of component names:

```yaml
components:
    - ComponentOne
    - ComponentTwo
```

## Using your Plugin

See [installing plugins](/plugins#installing-plugins)