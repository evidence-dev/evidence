---
sidebar_position: 100
title: Component Queries
---

Custom components in Evidence can include their own queries, allowing you to fetch data directly within the component rather than passing it as props. This gives you more flexibility in how you structure your components and can make them more self-contained.

## Basic Query Implementation

To add a query to your component, you'll need two key imports from Evidence's utilities:

```javascript
import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';
import { QueryLoad, Skeleton } from '@evidence-dev/core-components';
```

Here's a simple example of how to use these imports:

```html title="components/TableList.svelte"
&lt;script>
    // Build a static query
    const query = buildQuery(
        'SELECT * FROM information_schema.tables',
        'table-list-query' // Optional unique identifier
    );
</script>

<QueryLoad data={query} let:loaded={tables}>
    <ul>
        {#each tables as table}
            <li>{table.table_name}</li>
        {/each}
    </ul>
</QueryLoad>
```

Let's break down what's happening:

1. First, we use `buildQuery` to create our query. It takes two parameters:
   - The SQL query text
   - An optional unique identifier for the query

2. We then use the `QueryLoad` component to handle the query execution and loading states. The `let:loaded` syntax gives us access to our query results once they're ready.

<Alert status="info">

**About Query IDs**

While query IDs are optional, they can be helpful for debugging and performance optimization. If you're using multiple queries in your component, it's recommended to give each a unique identifier.

</Alert>

## Working with Loading States

The `QueryLoad` component automatically handles loading states for your queries. You have three main approaches for managing how loading states appear:

### 1. Custom Loading State (Recommended)
```html
<QueryLoad data={query} let:loaded={tables}>
    <div slot="skeleton" class="h-96 w-72">
        <Skeleton />
    </div>
    <!-- Your component content -->
</QueryLoad>
```

### 2. Hide Loading State
```html
<QueryLoad data={query} let:loaded={tables}>
    <svelte:fragment slot="skeleton" />
    <!-- Your component content -->
</QueryLoad>
```

### 3. Default Loading State
```html
<QueryLoad data={query} let:loaded={tables}>
    <!-- Your component content -->
</QueryLoad>
```

## Working with Query Results

There are several ways to access your query results within the `QueryLoad` component. Here are the different patterns and when to use them:

### Named Variable (Recommended)
```html
<QueryLoad data={query} let:loaded={tables}>
    {#each tables as table}
        <li>{table.table_name}</li>
    {/each}
</QueryLoad>
```
This approach is most clear and helps prevent naming conflicts. Use this when you want to give your query results a descriptive name.

### Default Variable
```html
<QueryLoad data={query} let:loaded>
    {#each loaded as table}
        <li>{table.table_name}</li>
    {/each}
</QueryLoad>
```
This pattern works well for simple components with only one query. However, it can become confusing in components with multiple queries.

### Query Named Variable
```html
<QueryLoad data={query} let:loaded={query}>
    {#each query as table}
        <li>{table.table_name}</li>
    {/each}
</QueryLoad>
```
While this works, it's not recommended as it can lead to confusion between the query definition and its results.

<Alert status="info">

**Best Practices**

- Use descriptive names for your query results that reflect the data they contain
- Avoid naming conflicts by not reusing variable names
- Consider using custom loading states for better user experience
- Include query IDs when debugging or working with multiple queries

</Alert>

## Next Steps

Now that you understand how to implement static queries in your components, you might want to explore:

- Adding multiple queries to a single component
- Working with dynamic queries that accept parameters
- Creating reusable query components
- Implementing error handling for your queries

## Dynamic Queries

Dynamic queries allow you to update your query text based on user input or component state. This is a more advanced feature that requires familiarity with JavaScript and Svelte's reactivity system. If you're new to Svelte, we recommend browsing their [tutorial](https://v4.svelte.dev/tutorial) before implementing dynamic queries.

<Alert status="info">

**JavaScript Knowledge Required**

Dynamic queries use more advanced JavaScript concepts including reactive declarations, callback functions, and state management. If you're not comfortable with these concepts yet, we recommend starting with static queries and gradually working your way up to dynamic implementations.

</Alert>

### Setting Up a Dynamic Query

Unlike static queries, dynamic queries require a different setup process that enables reactivity. Here's a basic example:

```html title="components/DynamicTableList.svelte"
&lt;script>
    import { QueryLoad } from '@evidence-dev/core-components';
    import { getQueryFunction } from '@evidence-dev/component-utilities/buildQuery';
    import { Query } from '@evidence-dev/sdk/usql';

    // This will hold our query result
    let query;

    // Create a query function that will update whenever we need new data
    const queryFunction = Query.createReactive({
        execFn: getQueryFunction(),
        callback: v => query = v
    });

    // Create a variable that will control our query
    let limit = 10;

    // This is a reactive declaration - the query will update whenever limit changes
    $: queryFunction(`SELECT * FROM information_schema.tables LIMIT ${limit}`);
</script>

<input type="number" bind:value={limit} min={0} />

<QueryLoad data={query} let:loaded={tables}>
    <ul>
        {#each tables as table}
            <li>{table.table_name}</li>
        {/each}
    </ul>
</QueryLoad>
```

Let's break down what's happening:

1. First, we set up our imports. Note that we're importing different utilities for dynamic queries.

2. We create a `query` variable that will hold our query result. This will be updated whenever our query changes.

3. We create a `queryFunction` using `Query.createReactive()`. This function:
   - Takes an execution function (provided by Evidence)
   - Accepts a callback that updates our query variable
   - Returns a function we can call with new query text

4. We set up a reactive declaration (marked by `$:`) that runs our query function whenever our variables change.

### Understanding Reactivity

The power of dynamic queries comes from Svelte's reactivity system. When you create a reactive declaration (using `$:`), Svelte automatically tracks dependencies and updates your query when they change.

For example, if we wanted to add multiple parameters:

```html
&lt;script>
    import { QueryLoad } from '@evidence-dev/core-components';
    import { getQueryFunction } from '@evidence-dev/component-utilities/buildQuery';
    import { Query } from '@evidence-dev/sdk/usql';
    
    // This will hold our query result
    let query;

    // Create a query function that will update whenever we need new data
    const queryFunction = Query.createReactive({
        execFn: getQueryFunction(),
        callback: v => query = v
    });

    let limit = 10;
    let schemaName = 'public';
    
    $: queryFunction(`
        SELECT * 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
        LIMIT ${limit}
    `);
</script>

<div>
    <input type="number" bind:value={limit} min={0} />
    <input type="text" bind:value={schemaName} />
</div>
```

Now our query will update whenever either `limit` or `schemaName` changes.

### Advanced Configuration

The `Query.createReactive()` function accepts additional configuration options for more complex use cases. Here are some commonly used options:

```javascript
const queryFunction = Query.createReactive({
    execFn: getQueryFunction(),
    callback: v => query = v,
    // Additional options:
    timeout: 5000,          // Query timeout in milliseconds
    maxRetries: 3,          // Number of retries on failure
    retryDelay: 1000,       // Delay between retries
    // See Evidence documentation for more options
});
```

For a complete list of configuration options, you can refer to:
- [Query Configuration Source](https://github.com/evidence-dev/evidence/blob/main/packages/lib/sdk/src/usql/query/Query.js#L728)
- [Query Types Definition](https://github.com/evidence-dev/evidence/blob/main/packages/lib/sdk/src/usql/types.ts#L35-L58)

### Next Steps

Now that you understand both static and dynamic queries, you might want to explore:
- Implementing error handling for dynamic queries
- Creating components that combine multiple dynamic queries
- Building interactive data exploration interfaces
- Optimizing query performance

Remember that dynamic queries are more powerful but also more complex. Start with simple implementations and gradually add more features as you become comfortable with the system.


## Error Handling

When working with queries in your components, it's essential to handle errors gracefully to provide a good user experience. The `QueryLoad` component provides built-in error handling capabilities through its error slot.

Here's how you can implement basic error handling:

```html
<QueryLoad data={query} let:loaded={queryResults}>
    <svelte:fragment slot="error" let:error>
        <div class="text-red-600">
            An error occurred: {error.message}
        </div>
    </svelte:fragment>

    <ul>
        {#each queryResults as item}
            <li>{item.name}</li>
        {/each}
    </ul>
</QueryLoad>
```

The error slot provides access to the error object through `let:error`, which contains information about what went wrong during query execution. This allows you to customize how errors are displayed to your users.

You can make your error handling more sophisticated by providing context-specific messages:

```html
<QueryLoad data={query} let:loaded={queryResults}>
    <svelte:fragment slot="error" let:error>
        <div class="text-red-600">
            {#if error.message.includes('timeout')}
                The query is taking longer than expected. Please try again.
            {:else if error.message.includes('permission')}
                You don't have permission to access this data.
            {:else}
                An unexpected error occurred while loading the data.
                Error details: {error.message}
            {/if}
        </div>
    </svelte:fragment>

    <ul>
        {#each queryResults as item}
            <li>{item.name}</li>
        {/each}
    </ul>
</QueryLoad>
```

<Alert status="info">

**Error Handling Best Practices**

- Always provide user-friendly error messages that explain what went wrong
- Include technical details only when they would be helpful to the user
- Consider providing action items or next steps when appropriate
- Use consistent error styling across your application

</Alert>

When working with dynamic queries, you might want to handle errors differently depending on the state of your component:

```html
&lt;script>
    let retryCount = 0;
    const MAX_RETRIES = 3;

    function handleError(error) {
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            // You could implement retry logic here
            queryFunction(currentQueryText);
        }
    }
</script>

<QueryLoad data={query} let:loaded={queryResults}>
    <svelte:fragment slot="error" let:error>
        <div class="text-red-600">
            {#if retryCount < MAX_RETRIES}
                Attempt {retryCount + 1} of {MAX_RETRIES}...
            {:else}
                Unable to load data after {MAX_RETRIES} attempts.
                Please try again later or contact support.
            {/if}
            
            <div class="text-sm mt-2">
                Error details: {error.message}
            </div>
        </div>
    </svelte:fragment>

    <ul>
        {#each queryResults as item}
            <li>{item.name}</li>
        {/each}
    </ul>
</QueryLoad>
```

This more advanced implementation includes retry logic and provides progressive feedback to users. The error handling adapts based on the number of retry attempts, giving users more context about what's happening and what they should do next.

Remember that good error handling isn't just about displaying error messages—it's about guiding users through problems and helping them understand what's happening. Consider providing:

1. Clear explanations of what went wrong
2. Potential solutions or next steps
3. Ways to recover from the error
4. Contact information for support when needed

You can combine error handling with loading states to create a complete user experience:

```html
<QueryLoad data={query} let:loaded={queryResults}>
    <div slot="skeleton">
        Loading your data...
    </div>

    <svelte:fragment slot="error" let:error>
        <div class="text-red-600">
            Unable to load data: {error.message}
            <button 
                class="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
                on:click={() => queryFunction(currentQueryText)}
            >
                Retry
            </button>
        </div>
    </svelte:fragment>

    <ul>
        {#each queryResults as item}
            <li>{item.name}</li>
        {/each}
    </ul>
</QueryLoad>
```

This approach creates a complete feedback loop for users, showing them when data is loading, handling errors gracefully, and providing ways to recover from problems. The combination of clear error messages and interactive elements helps users understand and resolve issues when they occur.