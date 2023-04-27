<script>
    import Accordion from '$lib/ui/Accordion.svelte';
    
    let accordionItems = [
    {
      title: "Accordion Item 1",
      content:
        "This is the first item's accordion body. It will remain hidden by default. Can be shown by adding the prop: `firstOpen = {true}`"
    },
    {
      title: "Accordion Item 2",
      content:
        "This is the second item's accordion body.",
    },
    {
      title: "Accordion Item 3",
      content:
        "This is the third item's accordion body.",
    },
  ];
</script>

## Accordion

<Accordion accordionItems={accordionItems} />
