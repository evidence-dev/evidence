---
sidebar_position: 5
---

# Custom Components

In Evidence, you can build your own components and use them anywhere in your project. This is made possible through Svelte, the JavaScript framework Evidence is built on. 

This guide covers everything you need to build components in Evidence. If you want to go further, Svelte offers a really great tutorial that you can complete in your browser in about an hour: [Svelte Tutorial](https://svelte.dev/tutorial)

We also have a more detailed walkthrough of creating a simple custom component [here](/walkthroughs/custom-components).

## What is a component?

A component is a self-contained block of code that you can reuse across your project. It can either be:

- **Static** - always produces the same output
    - You define exactly what you want the component to produce every time
    - E.g., a piece of text, a footnote, a specific shape, etc.
- **Dynamic** - produces a different output depending on some input(s)
    - You pass information to your component and define the logic it should use to produce the output
    - E.g., tables, charts, UI components with changeable colors, etc.

In either case, the final output is compiled into HTML, CSS, and JavaScript, and inserted into your page. Dynamic components use JavaScript to handle inputs and execute whatever logic is needed to produce the final output.

## Component Structure

Evidence components are Svelte components, which are written in `.svelte` files. 

`.svelte` files use a superset of HTML (HTML + some additional features added by Svelte). The basic structure of a `.svelte` component file is:

```html
<script>
// Insert JavaScript here
</script>

<!-- ---------- MAIN OUTPUT ---------- -->
<!-- Insert HTML or Svelte syntax here -->

<style>
/* Insert CSS styling here */
</style>
```

Everything in a component file is scoped to that component, so you don't need to worry about things like your CSS styles conflicting with the global CSS styles in your project.

### Main output

Components can be as simple as a line of text, or as complex as anything you can build in a web application. 

You can use HTML tags in the main part of a component file (e.g., `<p>`, `<span>`, `<div>`, etc.).

You can also use templating syntax like loops (`{#each}`) and conditionals (`{#if}`). See [Templating](/templating/templating) for examples of that syntax.

### Adding styles

Styles are applied using CSS, in the same way you would apply them in any web application. HTML tags can be included in the main output section, and styled using rules in the component's `<style>` tag. HTML tags can also be styled inline (e.g., `<div style="width: 50%">`). 

### Referencing variables

To use a variable from your `<script>` tag in the output of your component, reference the variable in curly braces in the main output part of the component file.

For example, this component creates a variable called `numVar`, which is set to 5, and returns that variable as its output:

```html
<script>
	let numVar = 5
</script>

{numVar}
```

Variables can only be referenced in the main output section, and cannot be used within the `<style>` tag. This means that inline styling in an HTML tag is often the best way to change CSS styles based on user input.

For example, the component below takes a color property as an input and uses it to style a `<div>` (see next section to learn about properties):

```html
<script>
	export let colorVar = "green"
</script>

<div style="width: 50%; color: {colorVar}"></div>
```

### Adding props

Properties (or "props") are used to pass information to your component

- E.g., `<MyComponent myProp="some text"/>`

In the component's code, the information passed through a prop is treated as a Javascript variable or object.

For example, when using an Evidence component, you reference your query result in the `data` prop:

- `<Value data={data.myquery}/>`
- The `<Value/>` component then reads the `data` prop as a Javascript object, executes some logic, and finally produces an output

To add a prop to your component code, add an **export** to your `<script>` tag like so:

```markdown
<script>
	export let myProp;
</script>
```

- `export` tells the component to accept information passed through that prop
- `let` is a JavaScript keyword to create a variable whose value can change

### Using query results

You can use query results in your component in the same way that Evidence does:

- Add a prop called `data` to your component
- When a query result is passed into your component from a markdown page, the component will receive the data as an array of JavaScript objects, where each object is a separate row:

```jsx
[
{"colA": 4, "colB": 6},
{"colA": 6, "colB": 12},
{"colA": 8, "colB": 9},
{"colA": 3, "colB": 4}
]
```

To transform this data for use in your component, you will need to use JavaScript. We will add to this section of the docs in the future, but if you would like to learn more about this you can look up online how to access data from JavaScript arrays & objects, or reach out to us in our community and we can help you out.

## Using components in your project

### Set up component library

Add a new folder in `src` called `components`. This will be your **component library directory**.

You can reference your library directory with the `$lib` shortcut instead of typing the full path to the folder (e.g., to reference a file in your library, it would be `$lib/MyFile.svelte`)

### Add components to library

Add `.svelte` files to your library directory using the component structure described in the section above.

### Import components into your markdown

Components from your library must be **imported** into your markdown files before they can be used. This can be accomplished by adding JavaScript to your markdown file (through a `<script>` tag). An import statement will look like this:

```html
<script>
	import MyComponent from '$lib/MyComponent.svelte'
</script>
```

- The name directly after the word `import` is the name you will use to reference the component in the rest of your code
- Component names should always have their first letter capitalized - this is to make it clear that it is not one of the standard HTML tags, which are all lowercased

### Use components in your markdown

Components are referenced using a "self-closing" tag with the name of your component (`<MyComponent/>`). You can include these tags anywhere in your markdown file, in the same way you would reference one of Evidence's built-in components.

## Code Style Rules

- Component name should start with a capitalized letter: `<MyComponent/>`
- Prop names should use "camel case", where the first word is fully lowercase and any other words are capitalized: `myPropName`

## Example

Below is an example of a component that takes a query result and prints it into an HTML table:

#### Component

```html title='$lib/SimpleTable.svelte'
<script>
	export let data;
</script>

<table>
    <thead>
        <tr>
        {#each Object.keys(data[0]) as column}
            <th>{column}</th>
        {/each}
        </tr>
    </thead>

  <tbody>
    {#each Object.values(data) as row}
      <tr>
        {#each Object.values(row) as cell}
          <td>{cell}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
    table, th, td {
      border: 1px solid;
      border-collapse: collapse;
      margin: 10px;
      width: 100px;
      text-align: center;
      font-family: Arial;
    }
</style>
```

#### Markdown (import + use component)

```html title="src/pages/index.md"
<script>
	import SimpleTable from '$lib/SimpleTable.svelte'
</script>

Below is an example of a custom component in action:
<SimpleTable data={data.my_query}/>
```