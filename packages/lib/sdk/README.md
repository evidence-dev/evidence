<img src="../../../sites/docs/static/img/wordmark.svg" alt="evidence-logo" width="100%" />

<div align="center">

<h1> Evidence SDK </h1>
The fastest way to build highly interactive data apps

![GitHub Repo stars](https://img.shields.io/github/stars/evidence-dev/evidence?style=social)
![NPM](https://img.shields.io/npm/l/%40evidence-dev%2Fsdk)
![NPM Version (with dist tag)](https://img.shields.io/npm/v/%40evidence-dev%2Fsdk/preview?label=Version)
[![Join Slack](https://img.shields.io/badge/slack-join-blue?logo=slack&amp)](https://slack.evidence.dev)

</div>

**_This documentation has not been updated for the latest versions of the SDK_**

## How it works

The Evidence SDK contains all the tools needed to build interactive data apps, all the way from the database to the browser.

- **Datasource Connectors** - Plugins to connect to a variety of datasoures, including Databases, APIs, Flat files, and more
- **Run queries in the browser** - Universal SQL is the fastest way to use DuckDB WASM with your databases

## Installation

1. (If needed), create your SvelteKit project (e.g. `npm create svelte`)
2. Install the SDK `npm i @evidence-dev/sdk@preview`
3. Add the SDK to your project using `npx evidence-sdk add`
4. Use `npx evidence-sdk plugins install` if you did not install a plugin during `add`  
   5. If the data source you want to use is not listed, and there is an Evidence plugin for it, you can install the package and add it to `evidence.config.yaml` manually.
5. Create a new connection with `npx evidence-sdk connections edit`
   1. Once the connection is created, there will be a new `sources/[connection]` directory, for most connectors, you will need to create some source queries.
6. Populate the data with `npx evidence-sdk sources`

## Usage

See [the wiki](https://github.com/evidence-dev/sdk/wiki)

There are 2 methods for executing queries using the Evidence SDK; using `<code/>` elements, and calling `runQuery` directly.
`<code/>` elements automatically make their results available to child components (or pages, if used in a layout), while
`runQuery` keeps the query scoped to the current page.

### Using `<code/>`

#### Writing Queries

To add a query to your page, use a `<code/>` element with an `evidence-query-name` attribute (`lang=sql` is optional but recommended).

Wrapping this in a `<pre>` tag will prevent formatters from changing your SQL.

Example:

```svelte
<pre><code evidence-query-name="myFirstQuery" lang="sql">
SELECT * FROM my_first_table
</code></pre>
```

When using `<code/>`, you can interpolate variables from the page using _template string syntax_, Svelte syntax is not supported.

Working Example:

```svelte
<pre><code evidence-query-name="myFirstQuery" lang="sql">
SELECT * FROM my_first_table WHERE user_id = '${selectedUserId}'
</code></pre>
```

Broken Example:

```svelte
<pre><code evidence-query-name="myFirstQuery" lang="sql">
SELECT * FROM my_first_table WHERE user_id = '{selectedUserId}'
</code></pre>
```

#### Accessing Queries

To load queries that are placed on the page, create a reference to the queries store from `$evidence/queries`

```svelte
<script>
	import { getQueries } from '$evidence/queries';
	const queries = getQueries();
	/** @type {import("@evidence-dev/query-store").QueryStore} */
	let { myFirstQuery } = $queries;
	$: ({ myFirstQuery } = $queries);
</script>
```

`$queries` is a set of [`QueryStore`](https://github.com/evidence-dev/evidence/tree/main/packages/query-store) based on what is provided on the page.

#### Full Example

```svelte
<script>
	import { getQueries } from '$evidence/queries';
	const queries = getQueries();
	/** @type {import("@evidence-dev/query-store").QueryStore} */
	let { myFirstQuery } = $queries;
	$: ({ myFirstQuery } = $queries);
</script>

<pre><code evidence-query-name="myFirstQuery" lang="sql">
SELECT * FROM my_first_table
</code></pre>

{#if !$myFirstQuery.loaded}
	<!-- 
        The query has not yet loaded.
        $myFirstQuery.loading is also available, 
        but will be false if the store has not yet started to load.

        QueryStore should begin loading automatically when attempting to access data,
        but can be induced with .fetch()
     -->
	Loading...
{:else if $myFirstQuery.error}
	<!-- An error has been encountered -->
	Error: {$myFirstQuery.error.message}
{:else}
	<!-- Results have been loaded -->
	{#each $myFirstQuery as row (row.id)}
		Row ID: {row.id}
	{:else}
		No resuls available
	{/each}
{/if}
```

### Using `runQuery`

#### Full Example

```svelte
<script>
	import { runQuery } from '$evidence/queries';

	const myFirstQuery = runQuery('myFirstQuery', 'SELECT 1');
	myFirstQuery.fetch(); // This is not done for you when using runQuery

	// Queries can by dynamic
	let x = 0;
	// declare here to ensure it is defined
	let dynamicQuery = runQuery('dynamicQuery', `SELECT ${x}`);
	// react to updates in the query string
	$: dynamicQuery = runQuery('dynamicQuery', `SELECT ${x}`);
	$: dynamicQuery.fetch();
</script>

<!-- Usage is the exact same as above -->
{#if !$myFirstQuery.loaded}
	<!-- 
        The query has not yet loaded.
        $myFirstQuery.loading is also available, 
        but will be false if the store has not yet started to load.

        QueryStore should begin loading automatically when attempting to access data,
        but can be induced with .fetch()
     -->
	Loading...
{:else if $myFirstQuery.error}
	<!-- An error has been encountered -->
	Error: {$myFirstQuery.error.message}
{:else}
	<!-- Results have been loaded -->
	{#each $myFirstQuery as row (row.id)}
		Row ID: {row.id}
	{:else}
		No resuls available
	{/each}
{/if}
```

### Enabling SSR

If you are using the [`<code/>`](#using-code) method, all you need to do is make sure the server hook is installed.

If you are using the [`runQuery`](#using-runquery) method, you will need to use the `<QuerySSR/>` component.

#### Configuring SSR Hook

1. Ensure that you have a `./src/hooks.server.[js|ts]` file
2. Create or update the `handle` function to match:

   - To create:

   ```javascript
   import { ssrHook } from '$evidence/ssrHook.svelte.js';

   /** @type {import('@sveltejs/kit').Handle} */
   export async function handle({ event, resolve }) {
   	/** @type {{ name: string, queryString: string}[]} */
   	const presentQueries = [];
   	const response = await resolve(event, {
   		transformPageChunk: ssrHook(presentQueries)
   	});
   	return response;
   }
   ```

   - If you already use `resolve` and `transformPageChunk`, you can chain the functions like so:

   ```javascript
   import { ssrHook } from '$evidence/ssrHook.svelte.js';

   /** @type {import('@sveltejs/kit').Handle} */
   export async function handle({ event, resolve }) {
       /** @type {{ name: string, queryString: string}[]} */
       const presentQueries = []
       const evidenceChunkTransform = ssrHook(presentQueries)

       const response = await resolve(event, {
           transformPageChunk: ({html, done}) => {
               // ... Do something to html
               html = await evidenceChunkTransform({ html, done })
               // ... Do other things to html
               return html
       });
       return response;
   }
   ```

#### Using `<QuerySSR/>`

`<QuerySSR/>` registers your queries with the Evidence Preprocessor, which enables correct rehydration of your queries.

```svelte
<script>
	import { runQuery } from '$evidence/queries';
	import QuerySSR from '$evidence/QuerySSR.svelte';

	let manualQuery = runQuery('x', `SELECT * FROM users`);
	$: manualQuery = runQuery('x', `SELECT * FROM users`);
</script>

<QuerySSR queries={[manualQuery]} />
```
