---
title: Image
sidebar_position: 1
---

<Alert status=info>

    Note that you can also use [markdown syntax for images](/reference/markdown/#images). This component is useful when you need to customize the dimensions or styling of the image.
</Alert>


The `Image` component allows you to add responsive and styled images to your markdown pages. This component is useful for embedding images with optional alignment, width, and height settings, and includes accessibility features through the description attribute.

## Examples

### Custom size
<DocTab> 
    <div slot='preview'> 
    <Image url="https://raw.githubusercontent.com/evidence-dev/media-kit/refs/heads/main/png/wordmark-gray-800.png" description="Sample placeholder image"height="80" /> 
    </div>

```markdown
<Image 
    url="https://raw.githubusercontent.com/evidence-dev/media-kit/refs/heads/main/png/wordmark-gray-800.png"
    description="Sample placeholder image"
    height=80
/>
```
</DocTab>

### Aligned Left
<DocTab> 
    <div slot='preview'> 
    <Image url="https://raw.githubusercontent.com/evidence-dev/media-kit/refs/heads/main/png/wordmark-gray-800.png" description="Sample placeholder image"height="80" align=left/> 
    </div>

```markdown
<Image 
    url="https://raw.githubusercontent.com/evidence-dev/media-kit/refs/heads/main/png/wordmark-gray-800.png"
    description="Sample placeholder image"
    height=80
    align="left"
/>
```
</DocTab>

### With Border & Custom Padding
<DocTab> 
    <div slot='preview'> 
    <Image url="https://raw.githubusercontent.com/evidence-dev/media-kit/refs/heads/main/png/wordmark-gray-800.png" description="Sample placeholder image"height="80" border=true class="p-4"/> 
    </div>

```markdown
<Image 
    url="https://raw.githubusercontent.com/evidence-dev/media-kit/refs/heads/main/png/wordmark-gray-800.png" 
    description="Sample placeholder image"
    height=80
    border=true 
    class="p-4"
/> 
```
</DocTab>

## Options

<PropListing 
    name="url"
    required={true}
>
The URL of the image.
</PropListing>

<PropListing 
    name="description"
    defaultValue=""
>
The description of the image for accessibility purposes.
</PropListing>

<PropListing 
    name="width"
    defaultValue=""
    options="number"
>
The width of the image (in pixels)
</PropListing>

<PropListing 
    name="height"
    defaultValue=""
    options="number"
>
The height of the image (in pixels)
</PropListing>

<PropListing 
    name="border"
    defaultValue="false"
    options={['true', 'false']}
>
Whether to display a border around the image
</PropListing>

<PropListing 
    name="align"
    options={['center', 'left', 'right']}
    defaultValue="center"
>
The alignment of the image
</PropListing>

<PropListing
    name="class"
>

Pass custom classes to control the styling of an accordion item. Supports [tailwind classes](https://tailwindcss.com). 

</PropListing> 
