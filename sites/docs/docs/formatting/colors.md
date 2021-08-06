---
sidebar_position: 5
hide_table_of_contents: false
---

# Colors

In any component with a color property (e.g., `fillColor`, `lineColor`), you can pass in a color code that can be read by CSS (standard CSS color names, hexadecimal color, RGB code).

In a multi-series chart, colors are automatically applied using the **Evidence palette** (which can be seen in the `app.css` file in your project):

![color-palette](/img/color-palette.png)

## Use Evidence Palette Colors
If you would like to use colors from the Evidence palette, you can access them using global CSS variables (`var(--colorname)`). Color names in the Evidence palette all follow the same naming convention, each with its own id number.

For example, to use the first color in the palette, you would type: `color=var(--color1)` 

And to get the fourth color: `color=var(--color4)`

:::note Color Options
We will be expanding the options for color palettes in future releases.
:::