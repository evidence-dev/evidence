<script>
	import { dev } from '$app/environment';
	import KebabIcon from '$lib/icons/KebabIcon.svelte';
	import ExternalLinkIcon from '$lib/icons/ExternalLinkIcon.svelte';
	import clickOutside from '$lib/modules/clickOutside';
	let options = [
		{ label: 'Export PDF', prod: true },
		{ label: 'Connect Data Source', url: '/settings/#connect-database', prod: false },
		{ label: 'Deploy Project', url: '/settings/#deploy', prod: false },
		{ label: 'Project Settings', url: '/settings', prod: false },
		{ label: 'Docs', url: 'https://docs.evidence.dev', prod: false },
		{
			label: 'Get Help on Slack',
			url: 'https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q',
			prod: false
		}
	];

	function print() {
		showDropdown = false;
		window.print();
	}

	let showDropdown = false;

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}
</script>

<div use:clickOutside={{ enabled: showDropdown, callback: () => (showDropdown = false) }}>
	<button type="button" class="menu" aria-label="page menu button" on:click={toggleDropdown}
		><KebabIcon /></button
	>
	{#if showDropdown}
		<ul class="dropdown-items" id="dropdown-items">
			{#each options as option}
				{#if dev || option.prod}
					<li>
						{#if option.label === 'Export PDF'}
							<button class="dropdown first" on:click={print}>{option.label}</button>
						{:else if option.url.includes('http')}
							<a href={option.url} target="_blank" rel="noreferrer"
								>{option.label}<ExternalLinkIcon height="12" width="12" color="--grey-700" /></a
							>
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
		color: var(--grey-600);
	}

	button.menu:hover {
		color: var(--grey-900);
		transition: all 0.2s;
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
