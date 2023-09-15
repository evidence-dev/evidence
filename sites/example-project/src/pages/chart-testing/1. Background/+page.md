# Background on Data Completion

The way we use ECharts, the data for each series on a chart is separated from the x-axis it sits on. ECharts constructs the axis and the series separately, and then puts them together on the page. 

Most of the time this is fine, but there is a risk that things become out of order and ECharts won't be able to recognize there is an issue - there are 2 cases where this breaks:
1. Unsorted data
2. Missing data

### Background - ECharts Axis Types
ECharts includes 4 axis types, of which we use the first 3:
1. Time
2. Value
3. Category
4. Log

## Unsorted Data

This only impacts line charts with a `value` x-axis. The chart will attempt to plot the data in the order it is received, so if the data is unsorted, it can result in the line chart making odd turns and going in the wrong direction.

This doesn't apply to `time` axes because ECharts is able to handle the ordering correctly.

## Missing Data

There are several scenarios possible for missing data. The terminology here needs improvement, but is used in the rest of this Chart Testing section.

The scenarios are all combinations of (1) Data Structure and (2) Missing Data Type

### Data Structure
1. Single Series
    ```html 
    <LineChart data={countries} x=year y=sales/>
    ```
2. Multi-Series Using `series` Column
    ```html 
    <LineChart data={countries} x=year y=sales series=country/>
    ```
3. Multi-Series Using Multiple `y` Columns
    ```html 
    <LineChart data={countries} x=year y={['revenue', 'gross_profit']}/>
    ```
4. Multi-Series Using `series` Column and Multiple `y` Columns
    ```html 
    <LineChart data={countries} x=year y=sales series=country y={['revenue', 'gross_profit']}/>
    ```

Wherever a "series" is referenced, it applies to any combination from #2-4 above. 

#### Examples of a "series":
- **"Canada"** (single value from the `series` column)
- **"Revenue"** (column name of one of the `y` columns supplied)
- **"Revenue - Canada"** (combo of `y` column name and value from `series` column)

### Missing Data Type
1. Missing X ("Dataset Missing X")
   - An entire x value is missing from the dataset. E.g, if x-axis was years from 1990 to 2000, and 1994 did not appear in the data
2. Missing Y ("Series Missing X")
   - This name is misleading
   - Applies only to multi-series charts
   - This is when a series in the dataset is missing an x value
   - E.g., if you had x-axis with years from 1990 to 2000, and `series=country` with "Canada" and "US" as values - if Canada is missing 1994, that is considered a "Missing Y" scenario
3. X out of Sync ("Series X Out of Sync")
   - Applies only to multi-series charts
   - This is when the x values of the series in a dataset should line up, but don't
   - E.g., if you had on x-axis values from 0 to 5 incrementing by 0.5 and `series=country` with "Canada" and "US" - if Canada has 3.4 instead of 3.5, that's considered "X out of Sync"
4. Nulls
   - This one is straightforward - if any of the values in the dataset are null


## Filling in Missing Data

### Nulls
For `4. Nulls`, in most cases we don't need to do anything because the chart will handle the missing value automatically. For example, on a scatter plot or a bar chart, there won't be any point to plot, so nothing will appear. 

Issues can appear in line charts and area charts because the line needs to interpolate between points. Depending on your situation, you may want nulls handled differently.

To solve this, we offer the `handleMissing` prop in line and area charts, which can have these options:
- `gap`: line will show a gap where the null is
- `zero`: line will go down to 0 at that point
- `connect`: line will connect from the previous value to the next value (effectively ignoring the null)

### Missing X Values
The other 3 missing data types are all some variation of the dataset missing values on the x-axis. The solution is to fill those values into the dataset and send the completed dataset to ECharts.

There are 2 ways to fill missing x values:
1. Use the `complete` function from `TidyJS` to ensure that all combinations of `x` and `series` are fully included in the data (e.g., in the Missing Y example above, we need to insert a row with "Canada" and 1994 into the data, with nulls for any value columns)
2. `fillX` - determine the interval of data on the x-axis and ensure that every increment is represented in the data
   - This one is hard

These are all handled in the `getCompletedData` function in `component-utilities`.

## Testing `getCompletedData`  

These conditions must be true of the output of the function:
- Columns of the original data object and the ouput should be identical (no new columns, no name changes)
- Each series should contain the same number of rows as all other series
- Each series should contain the same x-values as all other series
- No duplicate rows
- Should fill in missing values with 0 if nullsZero is set
- When `fillX` is used, the interval between each x-value should be the same