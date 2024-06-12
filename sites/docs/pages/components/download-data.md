---
title: Download Data
sidebar_position: 1
---

```categories
select category, sum(sales) as sales from needful_things.orders
group by all
order by sales desc
```

The Download Data component allows you to place a link on your page to download a specified dataset to CSV.

<DownloadData data={categories}/>

```svelte
<DownloadData data={categories}/>
```

## Examples

### Custom Text
<LineBreak/>

<DownloadData data={categories} text="Click Here"/>

```svelte
<DownloadData data={categories} text="Click Here"/>
```

### Custom Query ID
<LineBreak/>

<DownloadData data={categories} queryID=my_file/>

```svelte
<DownloadData data={categories} queryID=my_file/>
```

## Options

<PropListing
    name=data
    required
    options="query name"
>

Query name, wrapped in curly braces

</PropListing>
<PropListing 
    name="display"
    options={['true', 'false']}
    defaultValue="true"
>

Whether link is visible. If using as part of a custom component, you can pass a variable representing the hover state of your component to control visibility.

</PropListing>
<PropListing 
    name="text"
    options=string
    defaultValue="Download"
>

Label to show on the link

</PropListing>
<PropListing 
    name="queryID"
    options=string
>

Label to include as the start of the CSV filename. If no queryID is supplied, "evidence_download" is used.

</PropListing>