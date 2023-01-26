---
sidebar_position: 3
hide_table_of_contents: false
title: Custom Components
---

In Evidence, you can build your own components and use them anywhere in your project. This is made possible through Svelte, the JavaScript framework Evidence is built on. 

Below is a **short guide** on building a simple component in Evidence. 

For a fuller guide, Svelte offers a really great interactive tutorial that you can complete in your browser in about an hour: [Svelte Tutorial](https://svelte.dev/tutorial/basics)

## Why build custom components?
### For yourself:
- **Less repetitive code** for you to write by "abstracting" it into a separate component.
- **Easier maintenance** of your project, as you only need to edit code in one place if you want to make changes.

### To share:
- **Share functionality with others** inside or outside your organization, by sharing your component with them.

:::tip Built a great component?
Let us know in our [Slack community](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q)! 

We'd love to see what you've built, and may add generally applicable components to the Evidence library!
:::



## Example custom component

If you were creating a component called `<Hello />`, which included some text and a BarChart, to use in `index.md`, you could do so like this:

Add a folder called `components/` in the root of your project. This is where Evidence looks for your Svelte components:



### Folder structure
```shell
.
|-- pages/
|   `-- index.md
`-- components/
    `-- Hello.svelte
```

`Hello.svelte` is your component. Add the following code to these two files:


### File contents

index.md
````html title="index.md"
<!-- You need to import the component. You can reference your components folder as '$lib' -->
<script&gt;
    import Hello from '$lib/Hello.svelte';
</script>


```sales_by_country
select 'Canada' as country, 100 as sales_usd
    union all
select 'USA' as country, 200 as sales_usd
    union all
select 'UK' as country, 300 as sales_usd
```

<!-- To use data in the component, pass it to the component as a prop
     You can use multiple queries, and name the props anything you like -->
<Hello query={sales_by_country} />
````

Hello.svelte
```html title="Hello.svelte"
<!-- To allow the component to accept data, you need to use the 'export let' syntax
     If you need any Evidence components inside your custom component, you must import them explicitly -->
<script&gt;
    export let query
    import BarChart from '@evidence-dev/components/viz/BarChart.svelte'
</script>

<p>Here is a BarChart in a Component, with some accompanying text. 
Components stored in the /components/ folder will be included in your project.</p>

<BarChart data={query} />
```


## Building your own component: Checklist

If you're building a component, here are some things to keep in mind:

In your markdown file:
1. **`import` the custom component** into any .md files where you want to use it.
1. **Pass any data as props** if you need to access query results in the component

In the custom component:
1. **Use the `/components/` folder** for your .svelte files
1. **`export` any props you want to use** in the component
1. **Import any [Evidence components](https://github.com/evidence-dev/evidence/tree/main/sites/example-project/src/components)** you want to use in the components
1. **Use Svelte (HTML + extra features) syntax** in this component - it will not support Markdown