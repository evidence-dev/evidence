---
title: Markdown
hide_title: true
sidebar_position: 1
description: Evidence supports most markdown syntax. Below are some of the most common markdown features.
---

# Markdown Reference

Evidence supports most markdown syntax. Below are some of the most common markdown features. For more details, check out [Markdown Guide](https://www.markdownguide.org/cheat-sheet/).

## Text Paragraphs

```markdown
This is a paragraph. It can be as long as you want.

Add line breaks by leaving a blank line between paragraphs.
```

## Text Styles

```markdown
**Bold** text is wrapped in double asterisks
_Italic_ text is wrapped in single asterisks
~~Strikethrough~~ text is wrapped in double tildes
`Inline code` is wrapped in backticks
```

## Lists

```markdown
- This is a unordered list
- It uses dashes
- To indicate items

1. This is an ordered list
1. It uses numbers to indicate order
1. The numbers you type don't matter, they will be automatically numbered
```

## Headers

```markdown
# H1 Header

## H2 Header

### H3 Header

#### H4 Header

##### H5 Header

###### H6 Header
```

## Links

```markdown
[External link](https://google.com)

[Internal link](another/page/)
```

## Images

```markdown
![An online image](https://i.imgur.com/xyI27iZ.gif)

![An image stored in the project's static folder](/my-image.png)
```

#### Storing Images and Static Files

Evidence looks for images in the `/static` folder in the root of your project. Create it if it doesn't exist.

```
+-- pages/
|   `-- index.md
`-- static/
    `-- my-image.png
```

## Code Fences

In Evidence, most code fences execute SQL queries and display the results in a table.

````markdown
This code fence will execute a SQL query and display the results:

```sql orders
SELECT *
FROM needful_things.orders
WHERE category = 'Sinister Toys'
```
````

The exception is if you use one of the [reserved language names](https://github.com/evidence-dev/evidence/blob/main/packages/lib/preprocess/src/utils/supportedLanguages.cjs), which will render the code in a code block.

````markdown
```python
names = ["Alice", "Bob", "Charlie"]

for name in names:
    print("Hello, " + name)
```

```r
names <- c("Alice", "Bob", "Charlie")

for (name in names) {
    print(paste("Hello, ", name))
}
```
````

## Tables

```markdown
| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Row 1    | Row 1    | Row 1    |
| Row 2    | Row 2    | Row 2    |
```

To display data in a table, use a [Data Table](/components/data-table) instead.

## Blockquotes

```markdown
> This is a blockquote
>
> It can span multiple lines
>
> > And can be nested
```

> This is a blockquote
>
> It can span multiple lines
>
> > And can be nested


## Horizontal Rule

```markdown
Below is a horizontal rule

---
```

Below is a horizontal rule

---

## Frontmatter

<Alert status=warning>

Frontmatter does not support Javascript statements at this time; and things may behave unexpectedly if wrapped in `{}`

</Alert>

To attach metadata (e.g. a title) to your page, you can use Frontmatter. Note that frontmatter _must_ appear as the first thing in your page; no content can come before it, or it won't be loaded properly.

Frontmatter is formatted like this:

```markdown
---
title: Evidence Docs
---
```

You can put whatever data you would like here, and it uses a [yaml syntax](https://yaml.org/), but some properties are special:

<PropListing
    name="title"
    description="Changes the name of the tab, the title displayed in the sidebar, adds a header to your page, and changes the breadcrumb for the page."
/>
<PropListing
    name="hide_title"
    description="If true, the title will not show as a header on the page"
    options={['true', 'false']}
/>
<PropListing
    name="description"
    description="Is used for search engines"
/>
<PropListing
    name="og"
    description="Changes how your link shows up when shared on things like Slack, Facebook, Twitter, Discord, etc"
/>
<PropListing
    name="og.title"
    description="Changes the title that appears in the embed; if this is not specified, but `title` is, then `title` is used (and vice versa)"
/>
<PropListing
    name="og.description"
    description="Changes the body of the embed"
/>
<PropListing
    name="og.image"
    description="Will appear in the embed if specified, but it is not required."
/>
<PropListing
    name="queries"
    description="References SQL queries stored in the /queries directory."
/>
<PropListing
    name="sidebar"
    description="Changes the visibility of the sidebar. 'show' results in a responsive sidebar, 'hide' results in a sidebar accessible via hamburger button and 'never' hides both - the sidebar and the hamburger button."
    options={['show', 'hide', 'never']}
/>
<PropListing
    name="sidebar_position"
    description="Changes the position of the page in the sidebar. When used in index.md pages, changes the position of their parent in the sidebar."
    options="positive integer"
/>
<PropListing
    name="sidebar_link"
    description="When set to false, no link to the page appears in the sidebar. When used in index.md pages, the parent directory will still appear in the sidebar but it will not function as a link."
    options={['true', 'false']}
/>
<PropListing
    name="breadcrumb"
>

Specify a query that returns a column named breadcrumb. The query can use `$&#123params.my_param&#125` to reference the URL parameters for the page. 

E.g.
`breadcrumb: &quot;select customer_name as breadcrumb from customers_table where customer_id = $&#123params.customer_id&#125&quot;`

</PropListing>

Anything outside of these values won't do anything on their own, but they will be accessible as [variables](/core-concepts/syntax/#expressions) on the page.

## Partials

<Alert status=warning>

Partials do not support live reload, or hot module replacement. You will need to refresh the page when you change a partial.

</Alert>

`./pages/index.md`
```markdown
&#123;@partial "my-first-partial.md"&#125;

And some content specific to this page.
```

`./partials/my-first-partial.md`
```markdown
# This is my first partial

This is some content in the partial.
```

Evidence supports re-using chunks of Evidence markdown using Partials.

Partials are placed in the `./partials` folder, and can be referenced in your markdown with `&#123;@partial "path/to/partial.md"&#125;` (do not include the `/partial` folder in the path).
