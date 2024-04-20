---
queries:
- orders_by_month.sql
---

```sql orders_by_month_filtered
select * from ${orders_by_month} where month between '${inputs.range.start}' and '${inputs.range.end}'
```

# Date Picker

<DateRange data={orders_by_month} dates=month name=range/>

<BarChart data={orders_by_month_filtered} x="month" y="sales_usd0k" />

# Date Picker with Presets Callback Function

<DateRange 
  name=range
  data={orders_by_month}
  dates=month  
  presetsFn={function(start, end) {

    // start and end are CalendarDate objects, https://react-spectrum.adobe.com/internationalized/date/CalendarDate.html
    // these are equal input start and end props, if specified
    // if not specified, these default to min an max dates for the data

    return [
      { label: 'First 90 Days', range: { start, end: start.add({ days: 90 }) } },
      { label: 'First 6 Months', range: { start, end: start.add({ months: 6 }) } },
      { label: 'First 2 Years', range: { start, end: start.add({ year: 2 }) } },
      {
        label: 'Last 12 Months',
        range: {
          start: end.subtract({ months: 12 }).set({ day: 1 }),
          end: end.subtract({ months: 1 }).set({ day: 31 })
        }
      },
      { label: 'Last 90 Days', range: { start: end.subtract({ days: 90 }), end } },
      { 
        label: 'Last month', 
        range: { 
          start: end.subtract({ month: 1}).set({ day: 1 }), 
          end: end.subtract({ month: 1}).set({ day: 31 }) 
        } 
      },
      { label: 'Current month', range: { start: end.set({ day: 1 }), end } },
      { label: 'Year to date', range: { start: end.set({ day: 1, month: 1 }), end } },
      { label: 'All Time', range: { start, end } },
    ]
  }}
/>