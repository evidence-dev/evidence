---
sidebar_position: 4
title: Tables
hide_title: true
hide_table_of_contents: false
---

<h1 class="community-header"><span class="gradient">&lt;DataTable/></span></h1>

![datatable](/img/datatable-medianrent.png)

```markdown
<DataTable
    data={query_name} 
/>
```
### Required Props
* **data** - query name, wrapped in curly braces

### Optional Props
* **rows** - # of rows to show in the table before paginating results. Default is 5 rows
* **rowNumbers** - turn index number column of table on or off. Default is on. Turn off with `rowNumbers=false`
* **rowLines** - turn table row borders on or off. Default is on. Turn off with `rowLines=false`

### Formatting
Formatting is automatically applied based on the column names of your SQL query result. See the [formatting](/features/value-formatting) section for more details.




