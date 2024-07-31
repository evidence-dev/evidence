<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import Dropdown from '../Dropdown.svelte';
	import DropdownOption from '../helpers/DropdownOption.svelte';
	import QueryLoad from '../../../query-load/QueryLoad.svelte';
	import { getContext } from 'svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { browser } from '$app/environment';

	const slowQuery = (...args) => {
		if (browser) {
			return new Promise((r) => setTimeout(r, 1)).then(() => query(...args));
		}
		return query(...args);
	};

	const inputs = getContext(INPUTS_CONTEXT_KEY);
	const baseQuery = Query.create(
		`SELECT id as value, tag as label from hashtags ORDER BY 1`,
		slowQuery,
		{ disableCache: false }
	);

	$: depQueryFactory(`
        SELECT users.full_name as label,
               users.id as value
            FROM posts
        INNER JOIN post_tags ON posts.id = post_tags.post_id
        INNER JOIN hashtags ON post_tags.hashtag_id = hashtags.id
        INNER JOIN users ON posts.user_id = users.id
        WHERE hashtags.id = ${$inputs?.hashtag?.value ?? -1}
        GROUP BY ALL
    `);

	let depQuery;
	const depQueryFactory = Query.createReactive({
		execFn: slowQuery,
		callback: ($v) => (depQuery = $v),
		loadGracePeriod: 2000
	});
</script>

<Dropdown defaultValue={0} name="hashtag" data={baseQuery} value="value" label="label" />
<QueryLoad let:loaded data={depQuery}>
	<Dropdown name="user" data={loaded} value="value" label="label" multiple selectAllByDefault>
		<DropdownOption value="All" />
	</Dropdown>
</QueryLoad>
