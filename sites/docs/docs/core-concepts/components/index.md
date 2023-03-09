---
sidebar_position: 1
title: Component Overview
description: Components are used to display charts and other visual elements
---

## What are Components?

Components are used to build charts and other visual elements in Evidence.

Components use angle brackets (`<` and `/>`) to wrap the component name, like HTML syntax. You then pass in data and configuration as `props`:  

```html
<ComponentName
    propOne=value 
    propTwo="another value" 
    ...
/>
```

## Showing Values in Text

The simplest component is the `Value` component. It displays a single value from a query. It can be used to put automatically updated values in text.


````markdown
```orders
SELECT 
    '2021-01-01' AS date,
    100 AS num_orders
```

The number of orders yesterday was <Value data={orders} column=num_orders />.

````

Above, we've passed in the query data `orders` in curly braces `{ }`, and specified the column we want to display `num_orders` in the `column` prop.

For more information on the `Value` component, see [Including Data in Text](/docs/core-concepts/components/value).


## Charts

Our chart library has a flexible, declarative API that lets you add default chart types, or create your own.

```markdown
<BarChart data={sales_by_region} />
```

<div style={{textAlign: 'center'}}>

![intro-chart](/img/exg-intro-chart.svg)

</div>

While our library offers a lot of customizable features, our defaults let you create beautiful, publication-quality charts with as little as a single line of code.

More information on the Chart Library can be found in the [Chart Library](/docs/core-concepts/components/chart-library) section.

Or else you can find documentation on all the charts in the [Components Reference](../../components)