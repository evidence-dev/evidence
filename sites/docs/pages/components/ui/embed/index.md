---
title: Embed
sidebar_position: 1
---

Use the `Embed` component to display external content, such as videos, maps, or other embeddable media, within your markdown pages. This component allows you to customize dimensions, add borders, and ensure responsive styling. 

## Default usage

<DocTab>
<div slot='preview'>
    <Embed 
        url="https://www.youtube.com/embed/UiCioBZ5IDU?si=dychrQurRTlhz9DN"
        title="Sample Video"
    />
</div>

```markdown
<Embed 
    url="https://www.youtube.com/embed/UiCioBZ5IDU?si=dychrQurRTlhz9DN"
    title="Sample Video"
/>
```
</DocTab>

### Custom size

<DocTab>
<div slot='preview'>
    <Embed 
        url="https://www.youtube.com/embed/UiCioBZ5IDU?si=dychrQurRTlhz9DN"
        title="Sample Video"
        height="200"
        width=400
        align=center
    />
</div>

```markdown
<Embed 
    url="https://www.youtube.com/embed/UiCioBZ5IDU?si=dychrQurRTlhz9DN"
    title="Sample Video"
    width=800
    height=450
/>
```
</DocTab>

### No border

<DocTab>
<div slot='preview'>
    <Embed 
        url="https://www.youtube.com/embed/UiCioBZ5IDU?si=dychrQurRTlhz9DN"
        title="Sample Video"
        border=false
    />
</div>

```markdown
<Embed 
    url="https://www.youtube.com/embed/UiCioBZ5IDU?si=dychrQurRTlhz9DN"
    title="Sample Video"
    border=false
/>
```
</DocTab>

## Options

<PropListing 
    name="url"
    required={true}
>
The URL of the embeddable content.
</PropListing>

<PropListing 
    name="title"
    defaultValue=""
>
A description or title for the embed, useful for accessibility purposes.
</PropListing>

<PropListing 
    name="width"
    defaultValue="100%"
    options="number"
>
The width of the embed (in pixels).
</PropListing>

<PropListing 
    name="height"
    defaultValue="400"
    options="number"
>
The height of the embed (in pixels).
</PropListing>

<PropListing 
    name="border"
    defaultValue="true"
    options={['true', 'false']}
>
Whether to display a border around the embed
</PropListing>

<PropListing 
    name="class"
>

Pass custom classes to control the styling of the embed wrapper. Supports [Tailwind classes](https://tailwindcss.com).
</PropListing>
