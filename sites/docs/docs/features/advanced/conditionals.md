---
title: Conditionals
sidebar_position: 2
---

Conditionals are critical tool for managing information overload, and ensuring that your reporting is consistently showing actionable information. 

Conditionals allow you to show a section of your document if a condition is met. You can optionally include `{:else}` and `{:else if}` blocks inside of your `{#if}...{/if}` blocks.

```json 
{#if condition}

Display this content. 

{:else if another condition}

A different piece of content. 

{:else }

Finally, this last piece of content.

{/if}
```

#### Example 

Imagine you wanted to encourage your sales leaders "up-sell" low margin customers, but only when there were enough low-margin customers to do that work in-bulk. You could use a conditional to do something like this: 

```markdown
{#if data.low_margin_customers.length > 15}

The following customers are generating low margins. 

Consider re-allocating an account management call block to up-sell these customers. 

<Table data={data.low_margin_customers/>

{:else }

There are fewer than fifteen low margin customers, which is not enough to fill a call block. 

{/if}
```
