---
sidebar_position: 1
hide_table_of_contents: false
title: 'Using Plugins'
---

# Plugins

Evidence uses a plugin system to load components (charts, buttons, and other visual parts of your project), and they are configured using the `evidence.plugins.yaml` file in your project.

By default, new Evidence projects are configured with all the components needed to create most reports, but if you want to add others, this guide will cover methods for doing so.

:::info
If you want to create new plugins, see [Creating a Plugin](/plugins/creating-a-plugin).
:::

## Installing Plugins

To install a plugin, use the `npm install` command. Make sure you include the `--save` flag or the plugin will not be saved with your project.

For example:

```bash
npm install --save @acme/charting 
```

Once the plugin is installed, you can add it to your plugin file and begin using it in your project.

:::info
Changes or additions to your plugins file will not take effect in your project without restarting the Evidence server. This can also be done by pressing the 'r' key in the terminal window where you have Evidence running.
:::

## Plugin file syntax

### Basic Example

Plugin files are written using [yaml](https://yaml.org/), and have a required structure.

Plugins are Javascript packages that are tailored to integrate tightly with Evidence.
In each configuration, the `components` object has a key for each plugin that matches
the package name.

In this example, the `@evidence-dev/core-components` and `@acme/charting` plugins are used.
Because [aliases](#component-aliases) or [overrides](#component-overrides) aren't being used, they have a value of `{}` (empty object).

```yaml
components:
    @evidence-dev/core-components: {}
    @acme/charting: {}
```

### Component Aliases

If a plugin provides a component that has a long title, or you simply want to give it another name
we can use `aliases`.

In this example, the `@acme/charting` plugin provides some component `LongNameForAChart`, it will be 
made available in the Evidence project as `AcmeChart`

```yaml
components:
    @acme/charting:
        aliases:
            LongNameForAChart: AcmeChart
```

### Component Overrides

Component plugins have the ability to override components from other plugins (e.g. you want to replace the builtin `QueryViewer`),
if you aren't sure that you want to use this feature, you probably don't want to use this feature.

Overrides can be specified as an array:
```yaml
components:
    @evidence-dev/core-components: {}
    @acme/charting:
        overrides:
            - QueryViewer
```

If you want to replace `QueryViewer` with a component named `CustomQueryViewer`, apply an alias to `CustomQueryViewer` first:
```yaml
components:
    @evidence-dev/core-components: {}
    @acme/charting:
        aliases:
            CustomQueryViewer: QueryViewer # Rename CustomQueryViewer
        overrides:
            - QueryViewer # Override QueryViewer with the now renamed CustomQueryViewer
```

### (Advanced) Using non-plugin packages

If you want to use a component library that is _not_ an Evidence component plugin, you can use the `provides` field to 
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