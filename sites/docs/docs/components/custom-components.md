---
sidebar_position: 99
hide_table_of_contents: false
title: Custom Components
---

Custom components allow you to extend the functionality of Evidence, as well as to make your code more reusable.

In Evidence, you can build your own components and use them anywhere in your project. This is made possible through Svelte, the JavaScript framework Evidence is built on. These components can include the charts used for visualization, custom components created completely from scratch, or adaptations of existing UI components such as the sidebar, menu, etc.

[Evidence Labs](https://labs.evidence.dev) contains several good examples of custom components.

Below is a **short guide** on building a simple component in Evidence.

For a fuller guide, Svelte offers a really great interactive tutorial that you can complete in your browser in about an hour: [Svelte Tutorial](https://svelte.dev/tutorial/basics)

:::tip Built a great component?
Let us know in our [Slack community](https://slack.evidence.dev)!

We'd love to see what you've built, and may add generally applicable components to Evidence Labs, or the Evidence component library!
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

```sql sales_by_country 
select 'Canada' as country, 100 as sales_usd 
union all 
select 'USA' as country, 200 as sales_usd 
union all 
select 'UK' as country, 300 as sales_usd 
```

<!-- To use data in the component, pass it to the component as a prop
     You can use multiple queries, and name the props anything you like -->
<Hello myData={sales_by_country} />
````

```html title="Hello.svelte"
<!-- To allow the component to accept data, you need to use the 'export let' syntax
     If you need any Evidence components inside your custom component, you must import them explicitly -->
<script>
	export let myData;
	import { BarChart } from '@evidence-dev/core-components';
</script>

<p>
	Here is a BarChart in a Component, with some accompanying text. Components stored in the
	/components/ folder will be included in your project.
</p>

<BarChart data={myData} />
```

## Modifying an existing component: Changing the project name
Modify an existing component by copying the component's source code into the /components directory, modifying it, and importing the new component as needed in your project.

In this example, we will modify the title at the upper-left of our reports to have a label of "Invoicing", rather than "Evidence".

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
```html title="MySidebar.svelte"
<div class="nav-header">
    <a href="/" on:click={() => (open = !open)}><h2 class="project-title">Invoicing</h2></a>
    <button class="close" on:click={() => (open = !open)}><CloseIcon height="36" width="36" /></button>
</div>
```

### Using our new component

To use our new sidebar, you must import it in place of the existing sidebar. The general approach we will follow here is described in [themes and layouts](/themes-and-layouts).

We start by copying the file `+layout.svelte` from `.evidence/template/src/pages/` into `/pages`, the same directory where we put new report [pages](/core-concepts/pages) as we create them. After opening this newly copied file, modify the import statement for the `Sidebar` component (inside the script tag) as follows:

```js title="+layout.svelte"
import Sidebar from "$lib/MySidebar.svelte";
```

`$lib` is shorthand for the `/components` directory in the root of our project. Since we didn't change the export name of our component, we only need to change the reference to the file and can leave everything else the same.

With these modifications, our project should now read "Invoices" as the title. This same approach can be used to modify any other UI elements as well.

## Building your own component: Checklist

If you're building a component, here are some things to keep in mind.

In your markdown file:

1. **Pass any data as props** if you need to access query results in the component

In the custom component:

1. **Use Svelte (HTML + extra features) syntax** in this component - it will not support Markdown
1. **Use the `/components/` folder** for your .svelte files
1. **`export` any props you want to use** in the component
1. **Import any [Evidence components](https://github.com/evidence-dev/evidence/tree/main/sites/example-project/src/components)** you want to use in the custom component

## Optional: Publishing Your Components as a Plugin
If you have built custom components that you would like other Evidence users to be able to use in their projects, you can publish them as an Evidence plugin. See the [Plugin section](/plugins/creating-a-plugin/) for more details.

## Utility Functions
Evidence provides a collection of helpful utility functions to use within custom components, for things like error handling, data manipulation, and value formatting.

To use these in your project, you must import them explicitly in the script tag portion of your component. The import line for each utlity function is included for reference below:

### Error Handling

#### checkInputs `checkInputs(data, reqCols, optCols)`
Accepts a dataset and list of columns, and returns an error if the dataset is empty, required columns are missing, or referenced columns do not exist in the data
```js
import checkInputs from '@evidence-dev/component-utilities/checkInputs';
```
- `data`: the query result you need to check
- `reqCols`: a list of columns that are required for your component (e.g., x or y for a chart)
- `optCols`: a list of optional columns

<br/>

#### ErrorChart `<ErrorChart error={error} chartType="My Chart"/>`
A component used to display an error state on the page
```js
import { ErrorChart } from '@evidence-dev/core-components';
```
- `error`: the error message to display
- `chartType`: the title that appears at the top of the error component

<br/>


### Data Manipulation

#### getDistinctValues `getDistinctValues(data, column)`
Returns an array of distinct values from a specified column in a dataset
```js
import getDistinctValues from '@evidence-dev/component-utilities/getDistinctValues';
```
- `data`: query result to pull the values from
- `column`: name of column to use

<br/>


#### getDistinctCount `getDistinctCount(data, column)`
Returns the count of distinct values in a column
```js
import getDistinctCount from '@evidence-dev/component-utilities/getDistinctCount';
```
- `data`: query result to pull the values from
- `column`: name of column to use

<br/>


#### getSortedData `getSortedData(data, col, isAsc)`
Returns the original dataset, sorted by the specific column and direction
```js
import getSortedData from '@evidence-dev/component-utilities/getSortedData';
```
- `data`: query result to pull the values from
- `col`: name of column to sort
- `isAsc`: if true, will sort ascending; otherwise, descending

<br/>


#### getColumnSummary `getColumnSummary(data, returnType = "object")`
Returns an object with information about each column (title, min, max, format, etc.)
```js
import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
```
- `data`: query result to summarize
- `returnType`: "object" or "array"

<br/>


#### getCompletedData `getCompletedData(data, x, y, series, nullsZero = false, fillX = false)`
Returns the original dataset with rows filled in as needed to complete a continuous number series
```js
import getCompletedData from '@evidence-dev/component-utilities/getCompletedData';
```
- `data`: query result which requires completed data
- `x`: name of column for x-axis
- `y`: name of column for y-axis
- `series`: name of column for series
- `nullsZero`: if true, will treat nulls as zeroes; otherwise, will leave as nulls
- `fillX`: if true, will find the smallest increment in the x-axis values and create rows as needed to create a continous series

<br/>


### Value & Label Formatting

#### formatValue `formatValue(value, columnFormat = undefined, columnUnitSummary = undefined)`
Returns a formatted value
```js
import { formatValue } from '@evidence-dev/component-utilities/formatting';
```
- `value`: value to format
- `columnFormat`: a format object for column being formatted (can be obtained from the `getColumnSummary` function)
- `columnUnitSummary`: an object containing the extents of the column, used for unit summary formatting like "M" or "B" (can be obtained from the `getColumnSummary` function)

<br/>


#### fmt `fmt(value, format)`
Simpler version of the `formatValue` function which does not require a format object
```js
import { fmt } from '@evidence-dev/component-utilities/formatting';
```
- `value`: value to be formatted
- `format`: a string representing a format tag name or an Excel-style format code

<br/>


#### formatTitle `formatTitle(column, columnFormat)`
Returns a formatted column title (with proper letter casing)
```js
import formatTitle from '@evidence-dev/component-utilities/formatTitle';
```
- `column`: name of column to be formatted
- `columnFormat`: a format object for column being formatted (can be obtained from the `getColumnSummary` function)
