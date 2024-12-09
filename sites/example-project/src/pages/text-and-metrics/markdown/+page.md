---
title: Markdown
---


# Heading Level 1

## Heading Level 2

### Heading Level 3

#### Heading Level 4

##### Heading Level 5

###### Heading Level 6

# ~~Heading Level 1 with Strikethrough~~

# Heading Level 1 with _Italics_

# Heading Level 1 with **Bold**

# Heading Level 1 with `code`

# Link Headers

# [Link h1](/)

## [Link H2](/)

### [Link H3](/)

#### [Link H4](/)

##### [Link H5](/)

###### [Link H6](/)


## Lists

### Unordered List

- Item 1
- Item 2
- Item 3

### Unordered List with Sub-items

- Item 1
  - Sub-item A
  - Sub-item B
- Item 2
- Item 3

### Ordered List

1. Item 1
1. Item 2
1. Item 3

### Ordered List with Sub-items

1. Item 1
   1. Sub-item A
   1. Sub-item B
1. Item 2
1. Item 3

## Text Decoration

**Bold**  
_Italic_  
~~Strikethrough~~  
Text<sup>superscript</sup>  
Text<sub>subscript</sub>  
# This is <u>Underline</u> and **Bold**

## Highlighting

This is how you <mark>highlight some text.</mark>

## Blockquotes

> This is a blockquote.

> This is another blockquote.
>
> > This is a nested blockquote.

It can be nice to be able to use italics selectively in blockquotes

> I hate Mondays
>
> -- _Garfield_

## Code

`variable_names` can be included in sentences.

## Code Block

```javascript
let x = 100;
let y = 200;
let z = x + y;
```

```python
x = 100
y = 200
z = x + y
```

```css
pre {
	overflow: scroll;
	background: #1f2937;
	border-radius: 3px;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}
```

## Horizontal Rule

Three asterisks create a horizontal rule:

---

## Links

Link to [Google](https://google.com)

## URLs & Email Addresses

<https://google.com>  
<fake@example.com>

## Images

![fav](/favicon.ico)

## Tables

| Column One | Column Two | Column Three |
| :--------: | :--------: | :----------: |
|     A `with code`      |     B      |      C       |
|     1      |     2      |      3       |
|     D      |     E      |      F       |
|     4      |     5      |      6       |
|     G      |     H      |      I       |
|     7      |     8      |      9       |


## Edge Cases

# Heading 1 with `inline code`

## Heading 2 includes a combination of [Link](http://example.com), `inline code`

### Heading 3 with `inline code`, **bold text**, and external links like [Google](http://google.com)

#### Heading 4 `inline code`

##### Heading 5 illustrating `code` with text

###### Heading 6 `code` and [Link to a Site](https://example.com)


| Left Aligned | Center Aligned | Right Aligned |
| :----------- | :------------: | ------------: |
| Row with multiple<br>lines of text in the table | You should be able to use `inline code` in cell that also contains quite a lot of inline text and it should render nicely | Hello |
| Another cell | **Bold** and *italic* text can be interchanged and dispersed throughout your tables | [Link](http://example.com) to another site on the internet |
| Third line of text that extends | Breaking over<br>multiple lines<br>as specified by the author of the table | `$pecial & ch@racters` should work just great in a table if you put them inline in code |

| **Bold Header** | *Italic Header* | `Code Header` |
| --------------- | --------------- | ------------- |
| Normal text | Text with `inline code` | Text with [Link](http://example.com) |
| > Blockquote | 1. List Item<br>2. Second Item | ![Image in cell](https://example.com/tiny.jpg) |
| Combined **bold**, *italic*, and `code` | ![Image](https://example.com/image.jpg "Title") | Nested<br>`code`<br>in lines |

