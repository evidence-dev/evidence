---
title: Download Data
description: Display a standalone button to download a specified dataset as a CSV file.
sidebar_position: 1
---

Display a standalone button to download a specified dataset as a CSV file. Note that this component is not visible on small screen widths.

```categories
select category, sum(sales) as sales from needful_things.orders
group by all
order by sales desc
```

<DocTab>
    <div slot='preview'>
        <DownloadData data={categories}/>
    </div>

```svelte
<DownloadData data={categories}/>
```
</DocTab>

## Examples

### Custom Text
<LineBreak/>

<DocTab>
    <div slot='preview'>
        <DownloadData data={categories} text="Click Here"/>
    </div>

```svelte
<DownloadData data={categories} text="Click Here"/>
```
</DocTab>


### Custom Query ID
<LineBreak/>

<DocTab>
    <div slot='preview'>
        <DownloadData data={categories} queryID=my_file/>
    </div>

```svelte
<DownloadData data={categories} queryID=my_file/>
```
</DocTab>

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