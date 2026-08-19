<script lang="ts">
	import { getDefaultConnection } from '../QueryService.context';
	import type { Connection } from './types';

	let { onResolved }: { onResolved: (connection: Connection) => void } = $props();

	// A user component nested below the layout resolves the connection the layout registered.
	onResolved(getDefaultConnection());
</script>
