```sql categories
  select
    category
  from needful_things.orders
  where category is not null
  group by 1
  order by category asc
```

```sql years
  select
    date_part('year', order_datetime) as year
  from needful_things.orders
  where year is not null
  group by 1
  order by year asc
```

<div class="grid grid-cols-2 overflow-x-hidden w-full">
<Dropdown
  name=category1
  value=category
  data={categories}
  title=Category
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All categories"/>
</Dropdown>

    category1: {inputs.category1.value}
</div>


<div class="grid grid-cols-2 overflow-x-hidden w-full">
<Dropdown
  name=category2
  value=category
  data={categories}
  title=Category
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All categories"/>
</Dropdown>

category2: {inputs.category2.value}

</div>
<div class="grid grid-cols-2 overflow-x-hidden w-full">
<Dropdown
  name=category3
  value=category
  data={categories}
  title=Category
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All categories"/>
</Dropdown>

category3: {inputs.category3.value}

</div><div class="grid grid-cols-2 overflow-x-hidden w-full">
<Dropdown
  name=category4
  value=category
  data={categories}
  title=Category
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All categories"/>
</Dropdown>

category4: {inputs.category4.value}

</div><div class="grid grid-cols-2 overflow-x-hidden w-full">

<Dropdown
  name=category5
  value=category
  data={categories}
  title=Category
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All categories"/>
</Dropdown>

category5: {inputs.category5.value}

</div><div class="grid grid-cols-2 overflow-x-hidden w-full">

<Dropdown
  name=category6
  value=category
  data={categories}
  title=Category
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All categories"/>
</Dropdown>

category6: {inputs.category6.value}

</div><div class="grid grid-cols-2 overflow-x-hidden w-full">

<Dropdown
  name=year1
  value=year
  data={years}
  title=Year
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All years"/>
</Dropdown>

year1: {inputs.year1.value}

</div><div class="grid grid-cols-2 overflow-x-hidden w-full">

<Dropdown
  name=year2
  value=year
  data={years}
  title=Year
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All years"/>
</Dropdown>

year2: {inputs.year2.value}

</div><div class="grid grid-cols-2 overflow-x-hidden w-full">

<Dropdown
  name=year3
  value=year
  data={years}
  title=Year
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All years"/>
</Dropdown>

year3: {inputs.year3.value}
</div><div class="grid grid-cols-2 overflow-x-hidden w-full">


<Dropdown
  name=year4
  value=year
  data={years}
  title=Year
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All years"/>
</Dropdown>

year4: {inputs.year4.value}

</div><div class="grid grid-cols-2 overflow-x-hidden w-full">

<Dropdown
  name=year5
  value=year
  data={years}
  title=Year
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All years"/>
</Dropdown>

year5: {inputs.year5.value}
</div><div class="grid grid-cols-2 overflow-x-hidden w-full">


<Dropdown
  name=year6
  value=year
  data={years}
  title=Year
  defaultValue="%"
>
  <DropdownOption value="%" valueLabel="All years"/>
</Dropdown>

year6: {inputs.year6.value}

</div>
