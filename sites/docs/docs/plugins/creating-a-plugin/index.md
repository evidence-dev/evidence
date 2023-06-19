# Creating a Plugin

You can create your own plugins to add components to Evidence. Plugins are Svelte libraries.

## Starting from a Template

The easiest way to get started is from the example component library [**on GitHub**](https://github.com/evidence-dev/labs), with a live demo of the components [here](https://labs.evidence.dev).

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

See [installing plugins](/plugins/using-plugins#installing-plugins)