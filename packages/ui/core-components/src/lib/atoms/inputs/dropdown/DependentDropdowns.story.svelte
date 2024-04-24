<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import Dropdown from './Dropdown.svelte';
	import QueryLoad from '../../query-load/QueryLoad.svelte';
	import { getContext } from 'svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { browser } from '$app/environment';

	const slowQuery = (...args) => {
		if (browser) {
			console.log('SLOW QUERY CALLED');
			return new Promise((r) => setTimeout(r, 1000)).then(() => query(...args));
		}
		return query(...args);
	};

	const inputs = getContext(INPUTS_CONTEXT_KEY);
	const baseQuery = Query.create(
		`SELECT id as value, tag as label from hashtags ORDER BY 1`,
		slowQuery,
		{ disableCache: true }
	);

	$: depQueryText = `
        SELECT users.full_name as label,
               users.id as value
            FROM posts
        INNER JOIN post_tags ON posts.id = post_tags.post_id
        INNER JOIN hashtags ON post_tags.hashtag_id = hashtags.id
        INNER JOIN users ON posts.user_id = users.id
        WHERE hashtags.id = ${$inputs?.hashtag?.value ?? -1}
        GROUP BY ALL
    `;
	let { initialValue: depQuery, updater: depQueryUpdate } = Query.reactive(
		slowQuery,
		depQueryText,
		{ disableCache: true }
	);
	$: {
		depQueryUpdate(depQueryText).then((v) => (depQuery = v));
		console.log('Bing bong');
	}

	$: displayQueryText = `
        SELECT COUNT(DISTINCT posts.id) as postCount
            FROM posts
        WHERE posts.user_id = ${$inputs?.user?.value ?? -1}
        GROUP BY ALL
    `;
	let { initialValue: displayQuery, updater: displayQueryUpdate } = Query.reactive(
		slowQuery,
		displayQueryText,
		{ disableCache: true }
	);
	$: displayQueryUpdate(displayQueryText).then((v) => (displayQuery = v));

	$: console.log(displayQuery);
</script>

<Dropdown defaultValue={0} name="hashtag" data={baseQuery} value="value" label="label" />

<pre class="text-xs">{depQuery.originalText}</pre>
<pre class="text-red">{depQuery.error?.message}</pre>
<QueryLoad let:loaded data={depQuery}>
	<pre slot="skeleton" class="text-xs h-64 overflow-y-auto">Loading...</pre>
	{loaded}
	<pre class="text-xs h-64 overflow-y-auto">{JSON.stringify(loaded, null, 2)}</pre>
	<Dropdown defaultValue={0} name="user" data={loaded} value="value" label="label" />
	{displayQuery}
</QueryLoad>
