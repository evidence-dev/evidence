---
sidebar_position: 1
hide_table_of_contents: false
title: 'Component Plugins'
---

# Component Plugins 

Evidence includes a plugin system which can be used to add components and data sources to your project. 

All Evidence projects include the Evidence `core-components` plugin by default. `core-components` has everything you need to build most use cases. 

Component plugins are Svelte component packages which include one or more additional components which you can use in your project. Once you have installed and registered a component plugin, the included components will be available to use in your markdown files. 

## Installing Component Plugins 

```bash
npm install @acme/charting 
```

## Registering Component Plugins 

Once the plugin is installed, add it to `evidence.plugins.yaml` to register it in your project. 

```yaml
components:
    @evidence-dev/core-components: {}
    @acme/charting: {}
```


### Component Aliases

If a plugin provides a component that you want to reference with another name, you an `aliases` when registering the component. 

In this example, the `@acme/charting` plugin provides some component `LongNameForAChart`, it will be 
made available in the Evidence project as `AcmeChart`

```yaml
components:
    @acme/charting:
        aliases:
            LongNameForAChart: AcmeChart
```

### Component Overrides

Component plugins have the ability to override components from other plugins (e.g. you want to replace the builtin `LineChart` with ),

Overrides can be specified as an array:
```yaml
components:
    @evidence-dev/core-components: {}
    @acme/charting:
        overrides:
            - LineChart
```

If you want to replace `LineChart` with a component named `CustomLineChart`, apply an alias to `CustomLineChart` first:

```yaml
components:
    @evidence-dev/core-components: {}
    @acme/charting:
        aliases:
            CustomLineChart: LineChart # Rename CustomLineChart
        overrides:
            - LineChart # Override LineChart with the now renamed CustomLineChart
```

### (Advanced) Using generic svelte component libraries

If you want to use a svelte component library that is _not_ an Evidence component plugin, you can use the `provides` field to 
manually document the components that the library provides.

```yaml
components:
  @evidence-dev/core-components: {}
  carbon-components-svelte:
    provides:
      - Button
      - CodeSnippet
```

:::info
The components provided _must_ be named exports, e.g. `import {ComponentName} from 'package';`, _not_ `import ComponentName from 'package/ComponentName.svelte;`.
:::