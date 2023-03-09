---
title: Markdown Reference
sidebar_position: 1
---

Evidence supports most markdown syntax. Below are some of the most common markdown features. For more details, check out [Markdown Guide](https://www.markdownguide.org/cheat-sheet/).

## Text Paragraphs

```markdown
This is a paragraph. It can be as long as you want. 

Add line breaks by adding two spaces at the end of a line.
```

## Text Styles

```markdown
**Bold** text is wrapped in double asterisks
*Italic* text is wrapped in single asterisks
~~Strikethrough~~ text is wrapped in double tildes
`Inline code` is wrapped in backticks
```

## Lists

```markdown
- This is a unordered list
- It uses dashes
- To indicate items

1. This is an ordered list
2. It uses numbers
3. To indicate order
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

```
![An online image](https://i.imgur.com/xyI27iZ.gif)

![An image stored in the project](my-image.png)
```

#### Storing Images and Static Files

Evidence looks for images in the `/static` folder in the root of your project.

```
+-- pages/
|   `-- index.md
`-- static/
    `-- my-image.png
```

## Code Blocks

In Evidence, most code blocks execute SQL queries and display the results in a table.

The exception is if you use one of the [reserved language names](https://github.com/evidence-dev/evidence/blob/main/packages/preprocess/supportedLanguages.cjs), which will render the code in a code block.
 
````markdown
This code block will execute a SQL query and display the results:

```widget_orders 
SELECT * 
FROM orders 
WHERE category = 'widget'
```

These code blocks will render as a code blocks:

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

## Blockquotes

```markdown
> This is a blockquote
>
> It can span multiple lines
> > And can be nested
```

