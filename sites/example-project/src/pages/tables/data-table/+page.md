---
title: Data Table
sources:
  - orders_by_category: orders_by_category.sql
  - orders_with_comparisons: orders_with_comparisons.sql
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet enim rutrum, rutrum metus in, vulputate quam. Duis posuere enim feugiat urna fringilla blandit vehicula ac dui. Nunc consequat enim vel purus vestibulum rhoncus. Nunc porta luctus odio, ac luctus urna tincidunt cursus.
<DataTable data={orders_by_category}/>

Nulla facilisi. Aliquam vulputate mollis aliquam. Duis dignissim elementum dictum. Curabitur ornare lorem velit, eget tempus ex suscipit eu. Sed nec nisl a lorem vulputate interdum. Pellentesque viverra vitae est sed porttitor. Etiam interdum in enim a pellentesque.

<DataTable data={orders_with_comparisons} rowNumbers=true search=true rowLines=true/>

Aliquam massa elit, egestas eget risus nec, rhoncus vehicula ante. Cras placerat vitae ante eu hendrerit. Ut eget nunc nec ligula rutrum euismod. Vivamus at viverra elit. Nam id velit leo. Cras nisl velit, lacinia eget elementum vitae, tristique id purus. Vestibulum imperdiet congue mollis. Ut neque sapien, malesuada ut ultrices at, hendrerit at lorem. Aenean ornare suscipit pellentesque. Etiam facilisis nibh in diam suscipit, ut tincidunt est ultrices.

## Rows Property

### rows=40

<DataTable data={orders_by_category} rows=40 rowNumbers=true/>
