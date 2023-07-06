<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { dev } from '$app/environment';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { DotsVertical, ExternalLink } from '@steeze-ui/tabler-icons';

	import clickOutside from '@evidence-dev/component-utilities/clickOutside';
	import { showQueries, pageHasQueries } from '@evidence-dev/component-utilities/stores';
	let options = [
		{ label: 'Show / Hide Queries', prod: true },
		{ label: 'Export PDF', prod: true },
		{ label: 'Connect Data Source', url: '/settings/#connect-database', prod: false },
		{ label: 'Deploy Project', url: '/settings/#deploy', prod: false },
		{ label: 'Project Settings', url: '/settings', prod: false },
		{ label: 'View Project Schema', url: '/explore/schema', prod: false }, // TODO: Make this configurable
		{ label: 'Docs', url: 'https://docs.evidence.dev', prod: false },
		{
			label: 'Get Help on Slack',
			url: 'https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q',
			prod: false
		}
	];

	const beforeprint = new Event('export-beforeprint');
	const afterprint = new Event('export-afterprint');
	function print() {
		showDropdown = false;
		window.dispatchEvent(beforeprint);
		setTimeout(() => window.print(), 0);
		setTimeout(() => window.dispatchEvent(afterprint), 0);
	}

	function toggleQueries() {
		showQueries.update((value) => !value);
	}

	let showDropdown = false;

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}
</script>

<div use:clickOutside={{ enabled: showDropdown, callback: () => (showDropdown = false) }}>
	<button type="button" class="menu" aria-label="page menu button" on:click={toggleDropdown}>
		<Icon src={DotsVertical} class="text-gray-600 w-6 h-6" />
	</button>
	{#if showDropdown}
		<ul class="dropdown-items" id="dropdown-items">
			{#each options as option}
				{#if dev || option.prod}
					<li>
						{#if option.label === 'Show / Hide Queries'}
							{#if $pageHasQueries}
								{#if $showQueries}
									<button class="dropdown" aria-label="hide-queries" on:click={toggleQueries}>
										Hide Queries
									</button>
								{:else}
									<button class="dropdown" aria-label="show-queries" on:click={toggleQueries}>
										Show Queries
									</button>
								{/if}
							{/if}
						{:else if option.label === 'Export PDF'}
							<button class="dropdown first" on:click={print}>{option.label}</button>
						{:else if option.url.includes('http')}
							<a href={option.url} target="_blank" rel="noreferrer">
								{option.label}
								<Icon src={ExternalLink} class="h-3 w-3" />
							</a>
						{:else}
							<a href={option.url} target="_self">{option.label}</a>
						{/if}
					</li>
				{/if}
			{/each}
		</ul>
	{/if}
</div>

<style>
	.dropdown {
		position: relative;
		display: inline-block;
	}

	button {
		background-color: unset;
		padding: 0;
		cursor: pointer;
		border: none;
		line-height: normal;
	}

	button.menu {
		margin: 16px;
		font-size: unset;
	}

	ul {
		position: absolute;
		top: 100%;
		right: 10px;
		min-width: 170px;
		box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.2);
		padding: 8px 0 8px 0;
		border-radius: 5px;
		z-index: 1;
		background-color: white;
	}

	li {
		list-style-type: none;
		cursor: pointer;
		font-family: var(--ui-font-family);
		font-size: 0.7em;
		color: var(--grey-900);
		margin: 0;
	}

	li:hover {
		background-color: var(--grey-200);
	}

	a {
		text-decoration: none;
		color: var(--grey-900);
		display: flex;
		justify-content: space-between;
		padding: 10px 12px;
		line-height: normal;
		box-sizing: border-box;
		font-size: 14px;
		align-items: center;
	}

	button.dropdown {
		font-family: var(--ui-font-family);
		font-size: 14px;
		color: var(--grey-900);
		text-align: left;
		box-sizing: border-box;
		width: 100%;
		padding: 10px 12px;
	}
</style>
