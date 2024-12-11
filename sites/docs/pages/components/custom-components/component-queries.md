# Component Queries

Component queries allow you to run SQL queries in your component code.

Component queries transform how we build data visualizations. Instead of passing data down through props from parent pages, components become self-contained units that can request exactly what they need. This independence makes components more reusable and easier to maintain, as all the logic for both fetching and displaying data lives in one place.

## Static Queries

Static queries are "static" because the SQL string they run cannot change throughout the component's lifecycle. They are defined once when your component is created, and are executed when `QueryLoad` is mounted.

Here's how to create a component that fetches and displays information about tables in your database:

```html title="components/TableList.svelte"
&lt;script>
    import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';
    import { QueryLoad } from '@evidence-dev/core-components';

    const query = buildQuery(
        'SELECT * FROM information_schema.tables',
    );
</script>

<QueryLoad data={query} let:loaded={tables}>
    <svelte:fragment slot="skeleton" />
    
    <ul>
        {#each tables as table}
            <li>{table.table_name}</li>
        {/each}
    </ul>
</QueryLoad>
```

### The Query Loader

The `QueryLoad` component manages the entire lifecycle of your query execution. It handles:
- Executing your query against DuckDB
- Managing loading states
- Handling any errors that occur
- Delivering results to your component

```html
<QueryLoad data={query} let:loaded={tableData}>
    <svelte:fragment slot="skeleton" />
    <!-- Your component content here -->
</QueryLoad>
```

The `let:loaded` directive creates a new variable containing your query results. Using a descriptive name (like `tableData` or `salesMetrics`) makes your code more maintainable than the generic `loaded`.

## Dynamic Queries

As your components become more sophisticated, you might need queries that change based on user input or component state. This is where dynamic queries come in. They extend the static query pattern to create interactive visualizations, filtered tables, or any component that needs to fetch different data based on user actions.

Here's an example that lets users control how many rows to display:

```html title="components/DynamicTableList.svelte"
&lt;script>
    import { QueryLoad } from '@evidence-dev/core-components';
    import { getQueryFunction } from '@evidence-dev/component-utilities/buildQuery';
    import { Query } from '@evidence-dev/sdk/usql';

    // This will hold our current query result
    let query;

    // Create a reactive query function
    const queryFunction = Query.createReactive({
        execFn: getQueryFunction(),
        callback: v => query = v
    });

    // These values will control our query
    let limit = 10;
    let schemaName = 'public';

    // This reactive statement runs whenever limit or schemaName change
    $: queryFunction(`
        SELECT * 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
        LIMIT ${limit}
    `);
</script>

<div>
    <label>
        Rows to show:
        <input type="number" bind:value={limit} min={0} />
    </label>
    <label>
        Schema:
        <input type="text" bind:value={schemaName} />
    </label>
</div>

<QueryLoad data={query} let:loaded={tables}>
    <svelte:fragment slot="skeleton" />
    <ul>
        {#each tables as table}
            <li>{table.table_name}</li>
        {/each}
    </ul>
</QueryLoad>
```

Let's understand how this works:

### Query State Management

1. First, we create a variable to hold our query result:
   ```javascript
   let query;
   ```
   This will be updated every time our query executes with new parameters.

2. Next, we create a reactive query function:
   ```javascript
   const queryFunction = Query.createReactive({
       execFn: getQueryFunction(),
       callback: v => query = v
   });
   ```
   This sets up an environment that can execute queries and update our component's state.

3. Finally, we use Svelte's reactive declarations to run our query:
   ```javascript
   $: queryFunction(`SELECT * FROM ... LIMIT ${limit}`);
   ```
   The `$:` syntax tells Svelte to re-run this statement whenever `limit` changes, creating a connection between your component's state and your query.

## Error Handling

When working with queries, things can sometimes go wrong. Maybe a query is malformed, or perhaps it's trying to access a table that doesn't exist. The `QueryLoad` component helps you handle these situations gracefully through its error slot:

```html
<QueryLoad data={query} let:loaded={tables}>
    <svelte:fragment slot="skeleton" />
    
    <svelte:fragment slot="error" let:error>
        <div class="text-red-600">
            <h3 class="font-bold">Unable to load data</h3>
            <p>{error.message}</p>
            <p class="text-sm mt-2">
                Please check your query and try again.
            </p>
        </div>
    </svelte:fragment>

    <ul>
        {#each tables as table}
            <li>{table.table_name}</li>
        {/each}
    </ul>
</QueryLoad>
```

When a query fails, Evidence:
1. Captures the error information
2. Prevents the main content from rendering
3. Makes the error details available through `let:error`
4. Displays your error handling content

Common errors you might encounter include:
- Invalid SQL syntax
- References to non-existent tables
- Type mismatches in comparisons
- Memory limitations in DuckDB

### Next Steps

Now that you understand how to work with queries in your components, you might want to explore:
- Combining multiple queries in a single component
- Creating more complex interactive visualizations
- Building reusable query components
- Optimizing query performance in DuckDB

Remember that effective component queries balance functionality with maintainability. Start simple and add complexity only as needed for your specific use case.

<Alert status="info">
**Need Help?**

If you've built something interesting with component queries or need assistance, join our [Slack community](https://slack.evidence.dev)! We'd love to see what you're building and help you succeed with Evidence.
</Alert>