---
sidebar_position: 99
hide_table_of_contents: false
title: Custom Components
---

Custom components allow you to extend the functionality of Evidence, as well as to make your code more reusable.

In Evidence, you can build your own components and use them anywhere in your project. This is made possible through Svelte, the JavaScript framework Evidence is built on. These components can include the charts used for visualization, custom components created completely from scratch, or adaptations of existing UI components such as the sidebar, menu, etc.

Below is a **short guide** on building a simple component in Evidence.

For a fuller guide, Svelte offers a really great interactive tutorial that you can complete in your browser in about an hour: [Svelte Tutorial](https://svelte.dev/tutorial/basics)

:::tip Built a great component?
Let us know in our [Slack community](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q)!

We'd love to see what you've built, and may add generally applicable components to the Evidence library!
:::

## Example custom component

If you were creating a component called `<Hello />`, which included some text and a BarChart, to use in `index.md`, you could do so like this:

Add a folder called `components/` in the root of your project. This is where Evidence looks for your Svelte components:

### Folder structure

```
.
|-- pages/
|   `-- index.md
`-- components/
    `-- Hello.svelte
```

`Hello.svelte` is your component. Add the following code to these two files:

### File contents

````html title="index.md"
<!-- You need to import the component. You can reference your components folder as '$lib' -->
<script>
	import Hello from '$lib/Hello.svelte';
</script>

```sql sales_by_country 
select 'Canada' as country, 100 as sales_usd 
union all 
select 'USA' as country, 200 as sales_usd 
union all 
select 'UK' as country, 300 as sales_usd 
```

<!-- To use data in the component, pass it to the component as a prop
     You can use multiple queries, and name the props anything you like -->
<Hello query="{sales_by_country}" />
````

```html title="Hello.svelte"
<!-- To allow the component to accept data, you need to use the 'export let' syntax
     If you need any Evidence components inside your custom component, you must import them explicitly -->
<script>
	export let query;
	import { BarChart } from '@evidence-dev/core-components';
</script>

<p>
	Here is a BarChart in a Component, with some accompanying text. Components stored in the
	/components/ folder will be included in your project.
</p>

<BarChart data="{query}" />
```

## Modifying an existing component: Changing the project name
Modify an existing component by copying the component's source code into the /components directory, modifying it, and importing the new component as needed in your project.

In this example, we will modify the title at the upper-left of our reports to have a label of "Invoices", rather than "Evidence".

### Folder structure

```
.
|-- pages/
|   `-- index.md
`-- components/
    `-- MySidebar.svelte
```

First, create the `components/` directory if this is your first custom component. Then copy the file `Sidebar.svelte` from `.evidence/template/src/components/ui` into the directory, renaming it to `MySidebar.svelte` (or any other name of your choosing).

### Modifying the Component

With this new version of the component now created as a copy of the original, we are going to make our modifications.

After opening the `components/MySidebar.svelte` file, modify the h2 with a class of `project-title` to have inner text of "Invoicing", similar to the following:
```svelte title="MySidebar.svelte"
<div class="nav-header">
    <a href="/" on:click={() => (open = !open)}><h2 class="project-title">Invoicing</h2></a>
    <button class="close" on:click={() => (open = !open)}><CloseIcon height="36" width="36" /></button>
</div>
```

### Using our new component

To use our new sidebar, you must import it in place of the existing sidebar. The general approach we will follow here is described in [themes and layouts.](/themes-and-layouts).

We start by copying the file `+layout.svelte` from `.evidence/template/src/pages/` into `/pages`, the same directory where we put new report [pages](/core-concepts/pages) as we create them. After opening this newly copied file, modify the import statement for the `Sidebar` component (inside the script tag) as follows:

```svelte title="+layout.svelte"
import Sidebar from "$lib/MySidebar.svelte";
```

As noted in the comments on one of the snippets above, `$lib` refers to the `/components` directory in the root of our project. Since we didn't change the export name of our component, we only need to change the reference to the file and can leave everything else the same.

With these modifications, our project should now read "Invoices" as the title. This same approach can be used to modify any other UI elements as well.

## Building your own component: Checklist

If you're building a component, here are some things to keep in mind.

In your markdown file:

1. **You must `import` the custom component** into any .md files where you want to use it.
1. **Pass any data as props** if you need to access query results in the component

In the custom component:

1. **Use Svelte (HTML + extra features) syntax** in this component - it will not support Markdown
1. **Use the `/components/` folder** for your .svelte files
1. **`export` any props you want to use** in the component
1. **Import any [Evidence components](https://github.com/evidence-dev/evidence/tree/main/sites/example-project/src/components)** you want to use in the custom component
