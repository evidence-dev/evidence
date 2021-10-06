---
sidebar_position: 3
---

# Custom Components
In this walkthrough, we will show you how to create a custom component, get it included in your markdown page, and make your component dynamic using props.

If you have not already, please read the [Custom Components](/components/custom-components) page to learn the structure of components.

## Set up your component library

Add a new folder in `src` called `components`. This will be your **component library directory**.

You can reference your library directory with the `$lib` shortcut instead of typing the full path to the folder (e.g., to reference a file in your library, it would be `$lib/MyFile.svelte`)

## Create a new component

- In `src/components`, add a new file called `Today.svelte`. For now, put some placeholder text  ("TODAY") into that file so we can make sure the component is working as expected
- Open one of your markdown files to edit the code - we will use `src/pages/index.md` for this example, but it can be any of your pages
- We need to **import** our new component from the library into our file so that we can use it. We can do this using Javascript. To use Javascript in your markdown file, add a `<script>` tag - this will run any JavaScript you include inside the tag
- Add your import statement into your script tag. The top of your markdown file should look like this:
    
    ```markdown
    <script>
        import Today from '$lib/Today.svelte'
    </script>
    ```
    
- Add `<Today/>` somewhere in your markdown to test that the component has been imported successfully
- Save your markdown and open the page in your browser. You should see the text TODAY appear on your page.
    - If you don't see it, make sure all your code files have been saved and try refreshing your webpage. Post in the community if you run into issues.
- Congratulations! You now have a functioning custom component. Next we'll show you how to add functionality to your component.

## Make your component dynamic

Now we can add some logic to our `<Today/>` component to produce a dynamic result.

In `src/components/Today.svelte`, replace your placeholder text with the code below:

```html
<script>
    var today = new Date().toLocaleDateString();
</script>

{today}
```

This code creates a new Date object in JavaScript (which defaults to the current date), then uses a standard JavaScript function (`toLocaleDateString()`) to format the date into a normal format.

Save your file and go back to the page in the browser. You should now see today's date wherever you placed your component.

## Add styles to your component

Styles can be customized using the `<style>` tag and CSS style rules. This is done in the same way as it is in HTML files if you are familiar with writing HTML and CSS.

To use CSS styles, we need an HTML tag to reference in our style rules. We can wrap our variable in an HTML tag, assign a **class** to that tag, and define a style for that class:

```html
<script>
		var today = new Date().toLocaleDateString();
</script>

<span class="today">{today}</span>

<style>
	.today {
		color: green;
	}
</style>
```

In this example, we are using a `<span>` tag because we want our component to be used **inline** with our text (instead of creating a new line for itself, as other HTML tags would).

Styling and using HTML elements in Evidence is the same as it is in normal web development, so we won't re-explain those concepts in detail here. There are many great resources available online for learning HTML and CSS. Reach out in the community if you would like suggestions.

## Add props to your component

Now we can set the component up to receive inputs through properties ("props"). Props can be used to pass text, numbers, or objects to components.

Let's add a prop that will let you change the color of the date. Because variables cannot be referenced as easily within the `<style>` section of a component, the easiest way to set this up is to use inline styling of an HTML tag.

```html
<script>
	export let dateColor = 'green';	
	var today = new Date().toLocaleDateString();
</script>

<span style="color:{dateColor};">{today}</span>
```

Here we have added a prop for date color and set the default to 'green'. Our `<span>` tag is styled inline with this color.

Below is how you would reference your component if you wanted to change the date color to red:

```html
<Today dateColor=red/>
```

If you are passing a string into a prop, you don't need to use quotes around the string unless it contains a space.

## Using query results

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

Take a look at the simple table component on the [Custom Components](/components/custom-components) page to see how you can take a query result as an input and use it in a component.

## Advanced Custom Components

If you want to learn more advanced ways to build components, Svelte offers a really great tutorial that you can complete in your browser in about an hour: [Svelte Tutorial](https://svelte.dev/tutorial)