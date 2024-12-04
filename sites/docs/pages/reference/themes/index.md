---
sidebar_position: 4
hide_table_of_contents: false
title: Themes
description: Customize the appearance (dark / light / system), and colors schemes of your charts and UI elements.
---

Customize the appearance (dark / light / system), and colors schemes of your charts and UI elements from `evidence.config.yaml`.

# Appearance

Evidence supports three appearances: `dark`, `light`, and `system`

`system` matches the user's system appearance.

To enable appearances in your app, add to your config file:

`evidence.config.yaml`

```yaml
appearance:
    default: system 
    switcher: true
```

## Options

<PropListing
    name="appearance.default"
    options={['dark', 'light', 'system']}
    defaultValue="light"
>

The default appearance mode.

</PropListing>
<PropListing
    name="appearance.switcher"
    options={['true', 'false']}
    defaultValue="false"
>

Allow users to switch between dark and light themes from the `...` menu in the top right.

</PropListing>

# Theme

The theme is used to configure the styling of your charts and UI elements. The theme is defined in `evidence.config.yaml`.

- `colorPalettes` configure the colors for charts with different data series (e.g. [Bar Charts](/components/bar-chart/#props-colorPalette), [Line Charts](/components/line-chart/#props-colorPalette)).
- `colorScales` configure color range for charts with continuous data (e.g. [Heatmaps](/components/heatmap/#props-colorScale), [Area Maps](/components/area-map/#props-colorScale), [Data Tables](/components/data-table/#props-colorScale)).
- `colors` configure UI elements.

You can pass any valid CSS color values to these properties (Hex, RGB, HSL, Named CSS colors).

The default configuration is accessible below, as well as on [GitHub](https://github.com/evidence-dev/templates/blob/main/evidence.config.yaml).

<Details title='Default Configuration'>

```yaml
themes:
    colorPalettes:
        default:
            light:
                - "#236aa4"
                - "#45a1bf"
                - "#a5cdee"
                - "#8dacbf"
                - "#85c7c6"
                - "#d2c6ac"
                - "#f4b548"
                - "#8f3d56"
                - "#71b9f4"
                - "#46a485"
            dark:
                - "#236aa4"
                - "#45a1bf"
                - "#a5cdee"
                - "#8dacbf"
                - "#85c7c6"
                - "#d2c6ac"
                - "#f4b548"
                - "#8f3d56"
                - "#71b9f4"
                - "#46a485"
    colorScales:
        default:
            light:
                - "#ADD8E6"
                - "#00008B"
            dark:
                - "#ADD8E6"
                - "#00008B"
    colors:
        primary:
            light: "#2563eb"
            dark: "#3b82f6"
        accent:
            light: "#c2410c"
            dark: "#fdba74"
        base:
            light: "#ffffff"
            dark: "#09090b"
        info:
            light: "#0284c7"
            dark: "#38bdf8"
        positive:
            light: "#16a34a"
            dark: "#4ade80"
        warning:
            light: "#f8c900"
            dark: "#fbbf24"
        negative:
            light: "#dc2626"
            dark: "#f87171"
```

</Details>

## Color Palettes

You can modify the default chart color palette, or create a custom palette to pass to a specific chart via its `colorPalette` prop.

You can configure color palettes for appearance modes separately or together. 

### Modify Default Palette

If you specify light and dark, the color palette will be used in the specified appearance mode.

```yaml
themes:
    colorPalettes:
        default:
            light:
                - "#236aa4"
                - "#45a1bf"
            dark:
                - "#00008B"
                - "#ADD8E6"
```

### Modify All Appearances

If you do not specify light or dark, the color palette will be used for both appearance modes.

```yaml
themes:
    colorPalettes:
        default:
            - "#236aa4"
            - "#45a1bf"
            - "#a5cdee"
            - "#8dacbf"
```


### Custom Color Palette

```yaml
themes:
    colorPalettes:
        myCustomPalette:
            light:
                - "#236aa4"
                - "#45a1bf"
                - "#a5cdee"
                - "#8dacbf"
            dark:
                - "#00008B"
                - "#ADD8E6"
                - "#85c7c6"
                - "#d2c6ac"
```


## Color Scales

You can configure color scales for appearance modes separately or together.

### Modify Default Palette

```yaml
themes:
    colorScales:
        default:
            light:
                - "#ADD8E6"
                - "#00008B"
            dark:
                - "#ADD8E6"
                - "#00008B"
```

### Modify All Appearances

```yaml
themes:
    colorScales:
        default:
            - "#ADD8E6"
            - "#00008B"
```

## Colors

You can configure colors for appearance modes separately or together.

### Configure Appearances Individually

If you specify light and dark, the color will be used in the specified appearance mode.

```yaml
themes:
    colors:
        primary:
            light: "#2563eb"
            dark: "#3b82f6"
```


### Configure All Appearances

If you do not specify light or dark, the color will be used for both appearance modes.

```yaml
themes:
    colors:
        primary: "#2563eb"
```



### Semantic Color Listing

<PropListing
    name="colors.primary"
    defaultValue="Light: #2563eb, Dark: #3b82f6"
    description="Used for buttons, links, etc."
/>
<PropListing
    name="colors.base"
    defaultValue="Light: #ffffff, Dark: #09090b"
    description="Used for backgrounds"
/>
<PropListing
    name="colors.accent"
    defaultValue="Light: #c2410c, Dark: #fdba74"
    description="Used for accents"
/>
<PropListing
    name="colors.info"
    defaultValue="Light: #0284c7, Dark: #38bdf8"
    description="Used for Alerts, Annotations, etc"
/>
<PropListing
    name="colors.positive"
    defaultValue="Light: #16a34a, Dark: #4ade80"
    description="Used for Alerts, Delta indicators"
/>
<PropListing
    name="colors.warning"
    defaultValue="Light: #f8c900, Dark: #fbbf24"
    description="Used for Alerts, Annotations, etc"
/>
<PropListing
    name="colors.negative"
    defaultValue="Light: #dc2626, Dark: #f87171"
    description="Used for Alerts, Delta indicators"
/>



## Custom Styles

Evidence uses [Tailwind CSS](https://tailwindcss.com) to style Evidence components and markdown, and you can use Tailwind to add your own styles.

To style with Tailwind you add *classes* to HTML elements. You can use any HTML element in your markdown.

For more information on using Tailwind, see the [Tailwind documentation](https://tailwindcss.com/docs).

<Alert status="info">

Tailwind removes styling from HTML elements by default, so should add your own styles to `<h1/>`, `<a/>` etc. 

</Alert>

### Using the Evidence Default Styles in Custom HTML

Adding the `markdown` class to an element will style it the same as Evidence markdown, e.g.  `<h1 class='markdown'/>`. 

### Examples

#### Customize Fonts

```markdown
This is the default text style, which is used when you write text in a markdown file.

<p class="text-red-600 italic font-serif">This red italic serif text is defined inside a HTML p (paragraph) element.</p>

<p class="font-mono text-blue-500 mt-3">This is blue text using a monospace font, and a custom top margin.</p>
```

