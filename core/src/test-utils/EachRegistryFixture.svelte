<script lang="ts">
	let rows = $state.raw([{ id: 'r', n: 0 }]);
	let ready = $state(false);

	// Plain registries: children hand getters up, like components registering with a page context.
	const fromRows: { get: (() => number) | null } = { get: null };
	const fromMirror: { get: (() => number) | null } = { get: null };

	function register(registry: { get: (() => number) | null }, getter: () => number) {
		registry.get = getter;
		return '';
	}

	$effect(() => {
		ready = true;
	});
</script>

<button onclick={() => (rows = [{ id: 'r', n: rows[0].n + 1 }])}>increment</button>

{#each ready && fromRows.get ? [{ id: 'm', n: fromRows.get() }] : [] as mirror (mirror.id)}
	<span data-testid="mirror">{mirror.n}</span>{register(fromMirror, () => mirror.n)}
{/each}

{#each rows as row (row.id)}
	<span data-testid="row">{row.n}</span>{register(fromRows, () => row.n)}
{/each}

<b data-testid="outside">{ready && fromMirror.get ? fromMirror.get() : '-'}</b>
