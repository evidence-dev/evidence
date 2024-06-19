---
title: Accordion
---

# Normal Accordion 

<Accordion>
  <AccordionItem title="Item 1">

  # Accordion Content 

  This is the first item's accordion *body*.

  You can include markdown inside the body. 

  </AccordionItem>
<AccordionItem title="Item 2">
  This is the second item's accordion body.
</AccordionItem>
<AccordionItem title="Item 3">
  This is the third item's accordion body.
</AccordionItem>
</Accordion>

# Single Accordion 

Including the `single` prop prevents multiple accordions from being open at the same time 

<Accordion single>
  <AccordionItem title="Item 1">

  # Accordion Content 

  This is the first item's accordion *body*.

  You can include markdown inside the body. 

  </AccordionItem>
<AccordionItem title="Item 2">
  This is the second item's accordion body.
</AccordionItem>
<AccordionItem title="Item 3">
  This is the third item's accordion body.
</AccordionItem>
</Accordion>


# Accordion with a named title slot 
For creating complex accordion titles that incorporate other components or custom styling. 

<Accordion single>
  <AccordionItem title="Item 1">
    <span slot=title>
      <span class="text-red-600">Custom title with inlined styling </span> on some of the text 
    </span>

  # Accordion Content 

  This is the first item's accordion *body*.

  You can include markdown inside the body. 

  </AccordionItem>
<AccordionItem title="Item 2">
  This is the second item's accordion body.
</AccordionItem>
<AccordionItem title="Item 3">
  This is the third item's accordion body.
</AccordionItem>
</Accordion>

# Driven by a query 

```all_categories

select distinct category from needful_things.orders 

```


<Dropdown data={all_categories} name=selected_category value=category multiple selectAllByDefault/>

```example_query

select distinct category from needful_things.orders 
where category in ${inputs.selected_category.value}
order by 1 desc 

```

<Accordion>
{#each example_query as row}
<AccordionItem title={row.category}>

<Value data={row} /> 

</AccordionItem>
{/each}
</Accordion>