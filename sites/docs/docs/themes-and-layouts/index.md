---
sidebar_position: 4
hide_table_of_contents: false
title: Customizing Styles & Themes
---

Evidence supports customizing the look and feel of your project by overwriting default code files. We plan to make this easier in the future.

## Base Styles

Include an `app.css` file in your project root directory.

_The recommended approach is to copy and edit the default css file from `[my-project]/.evidence/template/src/app.css`, also found in the [Evidence Github repo](https://github.com/evidence-dev/evidence/blob/main/sites/example-project/src/app.css)._

### What can be customized with app.css?

You can customize the default styles (font, size, color etc) of most HTML elements, by adjusting the default css for the project, e.g.

- Headers
- Body text
- Images
- Links
- Page Background
- etc

You **cannot** currently easily customize the default styles of the following (as these are not defined in the core css styles):

- Evidence Chart colors and themes (see custom chart color section below)
- Evidence Components

## Page Layout

<!-- @archiewood update for SK 1.0 filenames -->

If you include a `+layout.svelte` file in a directory, any markdown files in that directory (and its subdirectories) will use this layout file instead of the default layout file.

_The recommended approach is to copy and edit the default layout file from `[my-project]/.evidence/template/src/pages/+layout.svelte`, also found in the [Evidence Github repo](https://github.com/evidence-dev/evidence/blob/main/sites/example-project/src/pages/+layout.svelte)._

### What can be customized with +layout.svelte?

By default, Evidence includes a number of features on every page, which can be removed or customized e.g.

- Sidebar
- Header
- Table of Contents

You can also add your own elements to the default page layout.

## Chart Color Palette

You can use a custom color palette in your charts by using the `colorPalette` option.

For example, in a bar chart:

```markdown
<BarChart
    data={orders}
    x=date
    y=sales
    colorPalette={
        [
        '#cf0d06',
        '#eb5752',
        '#e88a87',
        '#fcdad9',
        ]
    }
/>
```

This can be done within each chart individually, or by using a script tag to create a variable that can be used within one page. For example:

```markdown
<script>
    let myColors = [
        '#cf0d06',
        '#eb5752',
        '#e88a87',
        '#fcdad9',
    ]
</script>

<BarChart
    data={orders}
    x=date
    y=sales
    colorPalette={myColors}
/>

<LineChart
    data={inventory}
    x=date
    y=inventory
    colorPalette={myColors}
/>
```

At this time there isn't a way to globally set a custom color palette, but this will be included in future theme improvements.