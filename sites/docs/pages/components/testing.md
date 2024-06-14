```sql categories
select category from orders group by 1
```

```sql items
select item from orders group by 1
```



<Tabs>

{#each ['Items', 'Categories'] as value}

  <Tab label={value}>


{#if value == 'Items'}

  <Dropdown data={items}  name=select_one value=item label=Item/>

  {inputs.select_one.value}

  <Dropdown data={items}  name=select_two value=item label=Item/>

  {inputs.select_two.value}

{:else if value == 'Categories'}

  <Dropdown data={items}  name=select_three value=item label=Item/>

  {inputs.select_three.value}

  <Dropdown data={items}  name=select_four value=item label=Item/>

  {inputs.select_four.value}

{/if}


  </Tab>

{/each}

</Tabs>