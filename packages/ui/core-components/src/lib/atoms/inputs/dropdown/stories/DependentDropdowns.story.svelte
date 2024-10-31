<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import Dropdown from '../Dropdown.svelte';
	import DropdownOption from '../helpers/DropdownOption.svelte';
	import { browser } from '$app/environment';

	const slowQuery = (...args) => {
		if (browser) {
			return new Promise((r) => setTimeout(r, 1)).then(() => query(...args));
		}
		return query(...args);
	};

	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	const inputs = getInputContext();
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

<div class="grid grid-cols-2 gap-8">
	<div>
		<Dropdown defaultValue={0} name="hashtag" data={baseQuery} value="value" label="label" />
	</div>
	<div>
		<Dropdown name="user" data={depQuery} value="value" label="label" multiple selectAllByDefault>
			<DropdownOption value="All" />
		</Dropdown>
	</div>
</div>
