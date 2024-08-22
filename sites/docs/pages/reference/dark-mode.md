--- 
title: Dark Mode 
sidebar_position: 1
queries: 
- orders_by_day.sql
- orders_with_comparisons.sql
- orders_by_category_2021.sql
---

Invoked by setting the `experimentalDarkMode` prop on a project's layout. 


## CSS Tokens 

* Background, foreground, muted foreground etc. 
* Can be invoked in _both_ tailwind classes and in css variables 

## Mode Watcher 

* Store which gives the current mode
* Dark: operator in tw 
* Switch in the layout 

## Echarts dark theme 

* Detects the mode of the page, and toggles between themes in the main echarts action 

# Help needed / more to do 

* Toggling the echarts theme without needing to refresh 
* User's entering colours into props pose a problem 
* Prism theme 
* Prevent print in dark 
* Dropped reference lines 
* Calendar heatmap empty state 
* data table pagination Shifting on hover 
* Refactor atoms/button 
* Improve styling on atoms/tabs 
* Users should be able to provide a light and dark mode wordmark 
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


```sql la_locations
select *, 'https://www.google.com/search?q=' || point_name as link_col from la_locations
```

```sql orders_by_category
select order_month, count(1) as orders from needful_things.orders
group by all
```

<Grid cols=2>
    <LineChart data={orders_by_category} x=order_month y=orders/>
    <BarChart data={orders_by_category} x=order_month y=orders fillColor=#00b4e0/>
    <ScatterPlot data={orders_by_category} x=order_month y=orders fillColor=#015c08/>
    <AreaChart data={orders_by_category} x=order_month y=orders fillColor=#b8645e lineColor=#b8645e/>
</Grid>


<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=eur
    value=sales 
    valueFmt=eur
    pointName=point_name 
/>


<DataTable data={orders}> 
    <Column id=state title="Sales State"/> 
	<Column id=item/> 
	<Column id=category/> 
	<Column id=sales fmt=usd/> 
	<Column id=channel/> 
</DataTable>

# More stuff

<Alert>
This is a default alert
</Alert>

<Alert status="info">
This is a informational alert
</Alert>

<Alert status="success">
This is a successful alert
</Alert>

<Alert status="warning">
This is a warning alert
</Alert>

<Alert status="danger">
This is a dangerous alert
</Alert>


<ButtonGroup name=hardcoded_options>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>


<BigLink href='/components/big-link/'>My Big Link</BigLink>


# User-provided classes, referencing the tokens 

<Accordion class="rounded-xl bg-muted px-4 mt-4">
  <AccordionItem title="Item 1" class="border-none">
    <p>Content 1</p>
  </AccordionItem>
  <AccordionItem title="Item 2" class="border-none">
    <p>Content 2</p>
  </AccordionItem>
  <AccordionItem title="Item 3" class="border-none">
    <p>Content 3</p>
  </AccordionItem>
</Accordion>

```markdown 
<Accordion class="rounded-xl bg-muted px-4 mt-4">
  <AccordionItem title="Item 1" class="border-none">
    <p>Content 1</p>
  </AccordionItem>
  <AccordionItem title="Item 2" class="border-none">
    <p>Content 2</p>
  </AccordionItem>
  <AccordionItem title="Item 3" class="border-none">
    <p>Content 3</p>
  </AccordionItem>
</Accordion>
```


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