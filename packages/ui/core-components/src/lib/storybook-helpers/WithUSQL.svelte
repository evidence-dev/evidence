<script>
	import { setQueryFunction } from '@evidence-dev/component-utilities/buildQuery';
	import {
		query
	} from '@evidence-dev/universal-sql/client-duckdb';

	setQueryFunction(query);
</script>

<slot />
