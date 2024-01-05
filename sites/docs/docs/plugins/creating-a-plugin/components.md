# Creating a component plugin 

## Starting from a Template

The easiest way to get started is from the example component library [**on GitHub**](https://github.com/evidence-dev/labs), with a live demo of the components [here](https://labs.evidence.dev).

## Exporting Components

There are 2 ways to make components available to Evidence, [Module Exports](#module-exports) is the recommended method,
the [Manifest](#manifest) method can be used in cases when a large component library already exists.

Note that these are mutually exclusive, and the manifest takes priority.

In both cases, your components must be named exports from the root of your package; and the filename must match
the export name (in the case of module exports).

For example:
```javascript
export {default as ComponentName} from "./ComponentName";
```

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
