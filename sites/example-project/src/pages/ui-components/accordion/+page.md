---
title: Accordion
---

# Normal Accordian 

<Accordion>
  <AccordionItem title="Item 1">

  # Accordian Content 

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

# Single Accordian 

Including the `single` prop prevents multiple accordians from being open at the same time 

<Accordion single>
  <AccordionItem title="Item 1">

  # Accordian Content 

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
