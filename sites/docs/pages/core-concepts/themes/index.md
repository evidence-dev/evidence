---
sidebar_position: 10
hide_table_of_contents: false
title: Themes
description: Customize the appearance of your Evidence application in light and dark mode using the theming system.
sidebar_badge: New
---

Customize the appearance of your Evidence application in light and dark mode.

# Appearance Modes

Evidence supports three appearance modes: light, dark, and system. By default, new Evidence apps use the system mode and allow users to switch to light or dark via the appearance switcher.

When the appearance is `system`, the user's preferred appearance from their operating system is used.

The default appearance configuration is listed below, as well as in the [Evidence Template](https://github.com/evidence-dev/template/blob/main/evidence.config.yaml).

<div id="default-appearance-configuration" class="block relative -top-16 invisible"></div>
<Details title='Default appearance configuration'>

```yaml
appearance:
    default: system
    switcher: true
```

</Details>

## Options

<PropListing
    name="default"
    description="The default appearance mode."
    options={['dark', 'light', 'system']}
    defaultValue="light"
/>
<PropListing
    name="switcher"
    description="Shows/hides the appearance switcher in the kebab menu in the top right which allows users to switch the appearance of your application between light and dark mode."
    options={['true', 'false']}
    defaultValue="false"
/>

## Migration

To enable dark mode in an Evidence application created before themes was released, add the the following to your `evidence.config.yaml`:

```yaml
appearance:
    default: system
    switcher: true
```



# Theme

The theme configuration defines the colors used by your app.

The theme consists of 3 elements that define colors for different purposes:

- [Color palettes](#color-palettes) configure colors for charts with different data series (e.g. [Bar Charts](/components/bar-chart/#props-colorPalette)).
- [Color scales](#color-scales) configure color ranges for charts with continuous data (e.g. [Heatmaps](/components/heatmap/#props-colorScale)).
- [Colors](#colors) configure colors of UI elements (e.g. background, text, inputs).

You can pass any valid CSS color values to these properties (hexadecimal, RGB, HSL, named CSS colors, etc).

The default theme configuration is listed below, as well as in the [Evidence Template](https://github.com/evidence-dev/templates/blob/main/evidence.config.yaml).

<div id="default-theme-configuration" class="block relative -top-16 invisible"></div>
<Details title='Default theme configuration'>

```yaml
theme:
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

You can modify the default chart color palette, or create a custom palette for individual charts via their `colorPalette` prop.

Color palettes can have any number of colors listed. If a chart has more series than there are colors in a color palette, the colors will be reused.

### Default Color Palette

The `default` color palette is used by all series-based charts (e.g. [Bar Charts](/components/bar-chart/#props-colorPalette), [Line Charts](/components/line-chart/#props-colorPalette)).

You can configure the default color palette for light and dark mode individually (different colors for each):

```yaml
theme:
    colorPalettes:
        default:
            light:
                - "#1d4ed8"
                - "#0f766e"
                - "#a16207"
                - "#c2410c"
                - "#7e22ce"
            dark:
                - "#93c5fd"
                - "#5eead4"
                - "#fde047"
                - "#fdba74"
                - "#d8b4fe"
```

...or together (same colors for both):

```yaml
theme:
    colorPalettes:
        default:
            - "#3b82f6"
            - "#14b8a6"
            - "#eab308"
            - "#f97316"
            - "#a855f7"
```


### Custom Color Palettes

You can define your own custom color palettes in the same way, just replace `default` with your color palette's name:

```yaml
theme:
    colorPalettes:
        myCustomPalette:
            light:
                - "#e11d48"
                - "#be185d"
                - "#6d28d9"
            dark:
                - "#fb7185"
                - "#f9a8d4"
                - "#c4b5fd"
```

Then use it in the `colorPalette` prop

```markdown
<BarChart 
    data={my_data}
    colorPalette=myCustomPalette
/>
```

### Props

The `colorPalette` prop accepted by many components accepts a color palette in several different formats to reduce the friction of theming your app.

1. **Use a color palette name from your theme.** Its configured light and dark values will be used.
    ```markdown
    <BarChart 
        data={my_data}
        colorPalette=myColorPalette
    />
    ```

2. **Use a list of color names from your theme.** Their configured light and dark values will be used.
    ```markdown
    <BarChart
        data={my_data}
        colorPalette={[
            'primary',
            'accent',
            'myCustomColor',
        ]}
    />
    ```

3. **Use a list of colors (e.g. hex codes).** They will be automatically converted to similar colors for dark mode.
    ```markdown
    <BarChart
        data={my_data}
        colorPalette={[
            "#3b82f6",
            "#14b8a6",
            "#eab308",
            "#f97316",
            "#a855f7",
        ]}
    />
    ```

4. **Use a list of pairs of colors** to explicitly define light and dark mode values. The first column will be used when your application is in light mode, and the second when its in dark mode.
    ```markdown
    <BarChart
        data={my_data}
        colorPalette={[
            ["#1d4ed8", "#93c5fd"],
            ["#0f766e", "#5eead4"],
            ["#a16207", "#fde047"],
            ["#c2410c", "#fdba74"],
            ["#7e22ce", "#d8b4fe"],
        ]}
    />
    ```

## Color Scales

You can modify the default chart color palette, or create a custom palette for individual charts via their `colorScale` prop.

Color scales can have any number of colors listed. The colors will be blended into a gradient for values to interpolate from.

### Default Color Scale

The `default` color scale is used by charts that represent continuous data<!-- (e.g. [Heatmaps](/components/heatmap/#props-colorScale), [Area Maps](/components/area-map/#props-colorScale), [Data Tables](/components/data-table/#props-colorScale) -->.

You can configure the default color palette for light and dark mode individually (different colors for each):

```yaml
theme:
    colorScales:
        default:
            light:
                - "#0d9488"
                - "#4f46e5"
            dark:
                - "#5eead4"
                - "#a5b4fc"
```

...or together (same colors for both):

```yaml
theme:
    colorScales:
        default:
            - "#eab308"
            - "#22c55e"
```

### Custom Color Scales

You can define your own custom color scales in the same way, just replace `default` with your color scale's name:

```yaml
theme:
    colorScales:
        myCustomScale:
            light:
                - "#f97316"
                - "#ef4444"
            dark:
                - "#fdba74"
                - "#fb7185"
```

Then use it in the `colorScale` prop

```markdown
<DataTable data={country_summary}>
    <Column id=country />
    <Column id=value_usd contentType=colorscale colorScale=myCustomScale />
</DataTable>
```

### Props

The `colorScale` prop accepted by many components accepts a color scale in several different formats to reduce the friction of theming your app.

1. **Use a color scale name from your theme.** Its configured light and dark values will be used.
    ```markdown
    <BarChart 
        data={my_data}
        colorScale=myColorScale
    />
    ```

2. **Use a list of color names from your theme.** Their configured light and dark values will be used.
    ```markdown
    <BarChart
        data={my_data}
        colorScale={[
            'primary',
            'accent',
        ]}
    />
    ```

3. **Use a list of colors (e.g. hex codes).** They will be automatically converted to similar colors for dark mode.
    ```markdown
    <BarChart
        data={my_data}
        colorScale={["#3b82f6", "#14b8a6"]}
    />
    ```

4. **Use a list of pairs of colors** to explicitly define light and dark mode values. The first column will be used when your application is in light mode, and the second when its in dark mode.
    ```markdown
    <BarChart
        data={my_data}
        colorScale={[
            ["#1d4ed8", "#93c5fd"],
            ["#0f766e", "#5eead4"],
        ]}
    />
    ```

## Colors

Evidence uses a fixed set of color "tokens" for all UI elements in the entire application. This allows you to create a customized look and feel with only a couple lines of configuration.

```sql color_tokens
    select '<span class="font-semibold text-primary">primary</span>' as 'color', 'Represents your project/brand' as 'purpose', 'Logo color, buttons, links, DimensionGrid' as 'where-its-used' union all
	select '<span class="font-semibold text-accent">accent</span>', 'Focuses your attention', 'Map selected state (Chart selected state coming soon!)' union all
	select '<span class="font-semibold text-base-content">base</span>', 'The base color of your application', 'Background and text colors' union all
	select '<span class="font-semibold text-info">info</span>', 'Provide information', 'Alerts, annotations' union all
	select '<span class="font-semibold text-positive">positive</span>', 'Indicate something is good', 'Alerts, annotations, Delta indicator' union all
	select '<span class="font-semibold text-warning">warning</span>', 'Warn readers', 'Alerts, annotations' union all
	select '<span class="font-semibold text-negative">negative</span>', 'Indicate something is bad', 'Alerts, annotations, Delta indicator'
```

<DataTable data={color_tokens}>
	<Column id=color title=Color contentType=html />
	<Column id=purpose title=Purpose />
	<Column id=where-its-used title="Where its used" />
</DataTable>

You can modify existing color tokens, or create your own to use in charts and other UI elements.

### Overriding Colors

You can override a color for light and dark mode individually (different colors for each):

```yaml
theme:
	colors:
		primary:
			light: "#dc2626"
			dark: "#f87171"
		accent:
			light: "#7c3aed"
			dark: "#a78bfa"
```

...or together (same colors for both):

```yaml
theme:
	colors:
		primary: "#ef4444"
		accent: "#a855f7"
```

### Defining Your Own Colors

You can define your own custom colors in the same way, just replace the color name with your custom color's name:

```yaml
theme:
	colors:
		myColor: "#10b981"
		myOtherColor:
			light: "#c026d3"
			dark: "#f472b6"
```

Then use them in component props

```markdown
<Tabs color=myColor>
	<Tab label="Tab 1" id="tab1">Tab 1 content</Tab>
	<Tab label="Tab 2" id="tab2">Tab 2 content</Tab>
</Tabs>
```

```markdown
<BarChart
	data={my_data}
	fillColor=myOtherColor
/>
```

### Props

The color props accepted by many components (e.g. [`fillColor`](/components/bar-chart/#props-fillColor), [`labelColor`](/components/annotations/#props-labelColor)) accept a color in several different formats to reduce the friction of theming your app.


1. **Use a color name from your theme.** Its configured light and dark values will be used.
    ```markdown
    <BarChart
        data={my_data}
        fillColor=primary
    />
    ```

2. **Use a single color (e.g. hex code).** It will be automatically converted to a similar color for dark mode.
    ```markdown
    <BarChart
        data={my_data}
        fillColor="#3b82f6"
    />
    ```

3. **Use a pair of colors** to explicitly define light and dark mode values. The first color will be used when your application is in light mode, and the second when its in dark mode.
    ```markdown
    <BarChart
        data={my_data}
        fillColor={["#1d4ed8", "#93c5fd"]}
    />
    ```


## Advanced

The [colors listed above](/core-concepts/themes/#colors) are the bare minimum you should configure to theme your application. If you need more control, there are other colors you can customize.

```sql advanced_color_tokens
    select '<span class="p-0.5 rounded-sm font-semibold bg-primary text-primary-content">primary-content</span>' as 'color', 'Text color used on top of a primary background' as 'where-its-used', 'A readable shade of primary' as default union all
	select '<span class="p-0.5 rounded-sm font-semibold bg-accent text-accent-content">accent-content</span>', 'Text color used on top of an accent background', 'A readable shade of accent' union all
	select '<span class="p-0.5 rounded-sm font-semibold bg-base-100">base-100</span>', 'Page background color', 'Alias of `base`' union all
	select '<span class="p-0.5 rounded-sm font-semibold bg-base-200">base-200</span>', 'Secondary page background color', 'A shade of base-100' union all
	select '<span class="p-0.5 rounded-sm font-semibold bg-base-300">base-300</span>', 'Tertiary page background color', 'A shade of base-100' union all
	select '<span class="p-0.5 rounded-sm font-semibold text-base-content-muted">base-content-muted</span>', 'Muted text color', 'A shade of base-100' union all
	select '<span class="p-0.5 rounded-sm font-semibold text-base-content">base-content</span>', 'Body text color', 'A shade of base-100' union all
	select '<span class="p-0.5 rounded-sm font-semibold text-base-heading">base-heading</span>', 'Header text color', 'A shade of base-100' union all
	select '<span class="p-0.5 rounded-sm font-semibold bg-info text-info-content">info-content</span>', 'Text color used on top of an info background', 'A readable shade of info' union all
	select '<span class="p-0.5 rounded-sm font-semibold bg-positive text-positive-content">positive-content</span>', 'Text color used on top of a positive background', 'A readable shade of positive' union all
	select '<span class="p-0.5 rounded-sm font-semibold bg-warning text-warning-content">warning-content</span>', 'Text color used on top of a warning background', 'A readable shade of warning' union all
	select '<span class="p-0.5 rounded-sm font-semibold bg-negative text-negative-content">negative-content</span>', 'Text color used on top of a negative background', 'A readable shade of negative'
```

<DataTable data={advanced_color_tokens} rows=12>
	<Column id=color title=Color contentType=html />
	<Column id=where-its-used title="Where its used" />
	<Column id=default title=Default />
</DataTable>

These colors are included in the [Tailwind](https://tailwindcss.com) configuration for your Evidence application, so you can use them in your own HTML elements or custom Svelte components.

<DocTab defaultTab=code>
	<div slot=preview>
		<div class="bg-primary border border-primary p-4 text-primary-content">Hello!</div>
	</div>

```markdown
<div class="bg-primary border border-primary p-4 text-primary-content">Hello!</div>
```
</DocTab>

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

<DocTab>
	<div slot=preview>
		This is the default text style, which is used when you write text in a markdown file.

		<p class="text-red-600 italic font-serif">This red italic serif text is defined inside a HTML p (paragraph) element.</p>

		<p class="font-mono text-primary mt-3">This is primary colored text using a monospace font, and a custom top margin.</p>
	</div>

```markdown
This is the default text style, which is used when you write text in a markdown file.

<p class="text-red-600 italic font-serif">This red italic serif text is defined inside a HTML p (paragraph) element.</p>

<p class="font-mono text-primary mt-3">This is primary colored text using a monospace font, and a custom top margin.</p>
```
</DocTab>
