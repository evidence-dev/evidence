---
title: Create Component Plugin
description: You can create a component plugin to publish your own custom components for use across multiple Evidence apps.
sidebar_position: 3
---

You can build a component plugin to publish your own custom components, or to make existing open source component libraries easily available for Evidence users.

The easiest way to get started is from the example component library [**on GitHub**](https://github.com/evidence-dev/labs), with a live demo of the components [here](https://labs.evidence.dev).

## Basic Steps
1. Clone the [Evidence Labs example repo](https://github.com/evidence-dev/labs)
2. Add your components to the `src/lib` directory in place of the existing components
3. Add pages in the `pages` directory to show your components, in place of the existing pages
4. Set up component exporting (see section below)
5. Test that your components work by running the dev server with `npm run dev` and inspecting the pages you created
6. Edit the name in `package.json` from `@evidence-dev/labs` to `your-plugin-name` and set the version to `0.0.1`
7. Publish to npm with `npm publish` (You will need to be logged in to an [npm](https://www.npmjs.com/signup) account)
8. Install your plugin by following [the steps here](/plugins/component-plugins)
9. Make changes to your plugin and republish with `npm publish` - *note that you need to bump the version number in `package.json` each time you do this*


## Component Exporting

Plugins must "export" their components to make them available to your Evidence apps.

There are 2 ways to set up component exporting in your plugin:
1. [Module Exports](#module-exports) (recommended)
2. [Manifest](#manifest) - this method can be used in cases when a large component library already exists

*Note that these are mutually exclusive, and the manifest takes priority.*

### Module Exports

When writing a plugin from scratch, this is the preferred method.

#### Steps
1. Add the following to each component in your plugin to "flag" the component as something that should be imported as part of the plugin (at the top of the component's `.svelte` file)
```html title="ComponentOne.svelte"
&lt;script context="module"&gt;
    export const evidenceInclude = true;
&lt;/script&gt;
```
2. Add an `index.js` file to the `src/lib` directory
3. Add one line to `index.js` per component in your plugin. This will export the components, making them available in Evidence:
    ```javascript title="index.js"
    export {default as ComponentOne} from "./ComponentOne";
    export {default as ComponentTwo} from "./ComponentTwo";
    ```

### Manifest

If you would prefer not to flag each individual component file, another approach is to maintain an `evidence.manifest.yaml` file. The structure of the file is a single array of component names.

#### Steps
1. Add an `evidence.manifest.yaml` to your `src/lib` directory
2. Add a line to the file for each component in your plugin:
    ```yaml title="evidence.manifest.yaml"
    components:
    - ComponentOne
    - ComponentTwo
    ```
3. Add an `index.js` file to the `src/lib` directory
4. Add one line to `index.js` per component in your plugin. This will export the components, making them available in Evidence:
    ```javascript title="index.js"
    export {default as ComponentOne} from "./ComponentOne";
    export {default as ComponentTwo} from "./ComponentTwo";
    ```

## Promoting Your Plugin
If you are building a plugin for other Evidence users, [let us know in Slack](https://slack.evidence.dev) and we can share it with the community.


