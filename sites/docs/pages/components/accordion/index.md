---
title: Accordion
sidebar_position: 1
---

<DocTab>
  <div slot='preview'>
    <Accordion>
      <AccordionItem title="Item 1">

        This is the first item's accordion body.

        You can use **markdown** here too!

        Make sure to include an empty line after the component if you want to use markdown.

      </AccordionItem>
      <AccordionItem title="Item 2">

        This is the second item's accordion body with <b>bold text</b>.

      </AccordionItem>
      <AccordionItem title="Item 3">

        This is the third item's accordion body.

      </AccordionItem>
    </Accordion>
  </div>

  ```markdown 
  <Accordion>
    <AccordionItem title="Item 1">

      This is the first item's accordion body.

      You can use **markdown** here too!

      Make sure to include an empty line after the component if you want to use markdown.

    </AccordionItem>
    <AccordionItem title="Item 2">

      This is the second item's accordion body with <b>bold text</b>.

    </AccordionItem>
    <AccordionItem title="Item 3">

      This is the third item's accordion body.

    </AccordionItem>
  </Accordion>
  ``` 
</DocTab>

## Examples 

### Single Accordion 

<DocTab>
  <div slot="preview">
    <Accordion single>
      <AccordionItem title="Item 1">
        <p>Content 1</p>
      </AccordionItem>
      <AccordionItem title="Item 2">
        <p>Content 2</p>
      </AccordionItem>
      <AccordionItem title="Item 3">
        <p>Content 3</p>
      </AccordionItem>
    </Accordion>
  </div>

  ```markdown 
  <Accordion single>
    <AccordionItem title="Item 1">
      <p>Content 1</p>
    </AccordionItem>
    <AccordionItem title="Item 2">
      <p>Content 2</p>
    </AccordionItem>
    <AccordionItem title="Item 3">
      <p>Content 3</p>
    </AccordionItem>
  </Accordion>
  ```
</DocTab>

### Overriding Styles 

Use the `class` options to override the styles on the accordion. 

<DocTab>
  <div slot='preview'>
    <Accordion class="rounded-xl bg-gray-50 px-4 mt-4">
      <AccordionItem title="Item 1" class="border-none">
        <p>Content 1</p>
      </AccordionItem>
      <AccordionItem title="Item 2" class="border-none">
        <p>Content 2</p>
      </AccordionItem>
      <AccordionItem title="Item 3" class="border-none">
        <p>Content 3</p>
      </AccordionItem>
    </Accordion>
  </div>

  ```markdown 
  <Accordion class="rounded-xl bg-gray-50 px-4 mt-4">
    <AccordionItem title="Item 1" class="border-none">
      <p>Content 1</p>
    </AccordionItem>
    <AccordionItem title="Item 2" class="border-none">
      <p>Content 2</p>
    </AccordionItem>
    <AccordionItem title="Item 3" class="border-none">
      <p>Content 3</p>
    </AccordionItem>
  </Accordion>
  ```
</DocTab>

### Title Slot  

Pass components into the accordion title by using the slot `title`. 

```growth

select 0.366 as positive, -0.366 as negative

```
<DocTab>
  <div slot="preview">
    <Accordion>
      <AccordionItem title="Item 1">
        <span slot='title'>Custom Title <Value chip data={growth} fmt=pct1 /></span>
        Content 1 
      </AccordionItem>
      <AccordionItem title="Item 2">
        <p>Content 2</p>
      </AccordionItem>
      <AccordionItem title="Item 3">
        <p>Content 3</p>
      </AccordionItem>
    </Accordion>
  </div>

  ```markdown 
  <Accordion>
    <AccordionItem title="Item 1">
      <span slot='title'>Custom Title <Value data={growth} fmt=pct1 /></span>
      Content 1 
    </AccordionItem>
    <AccordionItem title="Item 2">
      <p>Content 2</p>
    </AccordionItem>
    <AccordionItem title="Item 3">
      <p>Content 3</p>
    </AccordionItem>
  </Accordion>
  ```
</DocTab>




## Options

### Accordion

<PropListing
    name="single"
    description="When true, only a single accordian item can be open at once."
    options={['true', 'false']}
/>

<PropListing
    name="class"
>

Pass custom classes to control the styling of the accordion body. Supports [tailwind classes](https://tailwindcss.com). 

</PropListing> 


### AccordionItem

<PropListing
    name="title"
    description="The title of the accordion item. This will be displayed as the header."
    required
/>

<PropListing
    name="class"
>

Pass custom classes to control the styling of an accordion item. Supports [tailwind classes](https://tailwindcss.com). 

</PropListing> 



