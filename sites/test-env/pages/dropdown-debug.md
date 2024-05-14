<script>
  import {IsSetTracked} from '@evidence-dev/sdk/usql'
</script>

```sql dropdownQuery
SELECT id as value, tag as label from hashtags ORDER BY 1
```

```sql chartQuery
SELECT COUNT(*) as postCount, tag FROM hashtags
        INNER JOIN post_tags pt on hashtags.id = pt.hashtag_id
        WHERE pt.hashtag_id in ${inputs.chartDriver.value}
        GROUP BY all
```

This dropdown is created with 3 default values (0, 1, 2) (actual {inputs.chartDriver.value})

<Dropdown data={dropdownQuery} name="chartDriver" label=label value=value multiple defaultValue={[0,1,2]}/>

This chart is expected to be x=tag y=postCount for selections in the above dropdown

<BarChart data={chartQuery} title="Posts by Hashtag" y=postCount x=tag/>

---

This a test of the each block to make sure that queries remain iterable

{#each chartQuery as d}
    <pre>{JSON.stringify(d, null, 2)}</pre>
{/each}


---

This dropdown should have an initial value of 5 (actual: {inputs.hardCodedDefault.value})


<Dropdown name="hardCodedDefault" defaultValue={[5]}>
  <DropdownOption label="1" value={1}/>
  <DropdownOption label="2" value={2}/>
  <DropdownOption label="3" value={3}/>
  <DropdownOption label="4" value={4}/>
  <DropdownOption label="5" value={5}/>
</Dropdown>

---

This is a custom echarts pie chart, haven't made it work yet

<ECharts config={{
        tooltip: {
            formatter: '{b}: {c} ({d}%)'
        },
        series: [
        {
          type: 'pie',
          data: chartQuery,
        }
      ]
      }
    }}
/>


