---
title: Dimension Grid
---

# Ecommerce 

Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet enim rutrum, rutrum metus in, vulputate quam. Duis posuere enim feugiat urna fringilla blandit vehicula ac dui. Nunc consequat enim vel purus vestibulum rhoncus. Nunc porta luctus odio, ac luctus urna tincidunt cursus.

```ecommerce_orders

select * from ecommerce.order_items 

```

```weekly_ecommerce_orders

select  
date_trunc('week', InvoiceDate),
count(*) filter(${inputs.selected_dimensions}) as selected_orders
from ecommerce.order_items
group by all 

```

<LineChart 
    data={weekly_ecommerce_orders}
/>

<DimensionGrid data={ecommerce_orders} name=selected_dimensions/>

Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet enim rutrum, rutrum metus in, vulputate quam. Duis posuere enim feugiat urna fringilla blandit vehicula ac dui. Nunc consequat enim vel purus vestibulum rhoncus. Nunc porta luctus odio, ac luctus urna tincidunt cursus.

```orders 

select 
id,
state, 
category, 
item,
channel_group,
channel,
sales
from needful_things.orders 

```


# Needful things 

<DimensionGrid data={orders} metric=sum(sales)/>

