---
title: Dimension Grid
queries:
  - orders_by_category: orders_by_category.sql
  - orders_with_comparisons: orders_with_comparisons.sql
---

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


<DimensionGrid data={orders} metric=sum(sales)/>