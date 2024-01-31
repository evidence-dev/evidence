---
title: Dimension Grid
---

# Ecommerce 

Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet enim rutrum, rutrum metus in, vulputate quam. Duis posuere enim feugiat urna fringilla blandit vehicula ac dui. Nunc consequat enim vel purus vestibulum rhoncus. Nunc porta luctus odio, ac luctus urna tincidunt cursus.

```ecommerce_orders

select * from ecommerce.order_items 

```

<DimensionGrid data={ecommerce_orders}/>

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

