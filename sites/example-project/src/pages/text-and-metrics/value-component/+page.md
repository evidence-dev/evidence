# Value Component

```sql summary
select 1000 as total_sales_usd
```

- Success: <Value data={summary}/>

The successful value metric is <Value data={summary}/> and shows up inline.

## Value Errors

Errors in the Value component are inlined into your text. Here's an example of an empty Value tag: <Value/> which will return an error, but will stay within your text. You can hover over the error to see an error message describing the problem.

- Empty tag: <Value/>
- Non-existent query result: <Value data=abc/>
- Non-existent column: <Value data={summary} column=abc/>
- Non-existent row without column: <Value data={summary} row=20/>
- Non-existent row with correct column: <Value data={summary} column=total_calls row=20/>
- Wrong query result name: error `abc is not defined` will appear at page-level

## Value Placeholders

If you like to mock up reports before you're ready to fill in real data, you can also override the Value error with a **placeholder**. Input the text you want to use as your placeholder and it will appear in blue font with square brackets, inline with your text.

Here are a few examples of placeholders:

<Value placeholder="Report Date"/>

Revenue has changed by <Value placeholder="YTD sales growth"/> this year, with the largest change occuring in <Value placeholder="top country name"/> (<Value placeholder="top country YTD growth"/>).
