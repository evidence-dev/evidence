--- 
title: Dark Mode 
sidebar_position: 1
queries: 
- orders_by_day.sql
- orders_with_comparisons.sql
- orders_by_category_2021.sql
---

Invoked by setting the `experimentalDarkMode` prop on a project's layout. 


## CSS Variables

1. Background, foreground, muted foreground etc. 
1. Can be invoked in _both_ tailwind classes and in css variables 

## Mode Watcher 

1. Store which gives the current mode
1. Switch in the layout 


## Echarts dark theme 

1. Detects the mode of the page, and toggles between themes in the main echarts action 


---- 


# Demo 


<DateRange
    name=date_range_name
    data={orders_by_day}
    dates=day
/>

<Dropdown data={categories} name=category2 value=category_name/>

<Checkbox
    title="Hide Months 0" 
    name=hide_months_0
/>


```sql categories
select distinct category as category_name, upper(left(category, 3)) as abbrev from needful_things.orders
```

```orders

select state, category, item, channel, sales from needful_things.orders

```

```monthly_sales

select 
order_month, 
sum(sales) as sales_usd0 
from needful_things.orders 
where ${inputs.selected_dimensions}
group by all 
```

<BigValue 
  data={orders_with_comparisons} 
  value=num_orders
/>

<BigValue 
  data={orders_with_comparisons} 
  value=num_orders
  comparison=order_growth
  comparisonFmt=pct1
  comparisonTitle="MoM"
/>

<DimensionGrid data={orders} metric='sum(sales)' name=selected_dimensions /> 

<AreaChart data={monthly_sales} handleMissing=zero/> 


<AreaChart 
    data={orders_by_category_2021}
    x=month
    y=sales
    series=category
/>


```sql la_zip_sales
select *, 'https://www.google.com/search?q=' || zip_code as link_col from la_zip_sales
where zip_code <> 90704
```


<AreaMap 
    data={la_zip_sales} 
    areaCol=zip_code
    geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
    geoId=ZCTA5CE10
    value=sales
    valueFmt=usd
    height=250
/>



# Markdown 

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
	background: var(--grey-800);
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








# More to do 

* Prism theme 
* Prevent print in dark 
* Dropped reference lines 
* Calendar heatmap empty state 
* data table pagination Shifting on hover 
* Refactor atoms/button 
* Improve styling on atoms/tabs 
* Users should be able to provide a light and dark mode wordmark 