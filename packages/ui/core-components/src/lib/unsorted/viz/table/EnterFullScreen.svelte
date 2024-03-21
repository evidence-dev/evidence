<script>
	import { fade } from 'svelte/transition';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { EnterFullScreen } from '@steeze-ui/radix-icons';

	export let display;
</script>

{#if display}
	<div transition:fade|local={{ duration: 200 }}>
		<button type="button" aria-label="Enter Fullscreen" on:click>
			<span>Fullscreen</span>
			<Icon class="w-3 h-3" src={EnterFullScreen} />
		</button>
	</div>
{/if}

<style>
	button :global(svg) {
		stroke: var(--grey-400);
		margin-top: auto;
		margin-bottom: auto;
		transition: stroke 200ms;
	}

	button {
		display: flex;
		cursor: pointer;
		font-family: var(--ui-font-family);
		font-size: 1em;
		color: var(--grey-400);
		justify-items: flex-end;
		align-items: baseline;
		background-color: transparent;
		border: none;
		padding: 0;
		margin: 0 5px;
		gap: 3px;
		transition: color 200ms;
		-moz-user-select: none;
		-webkit-user-select: none;
		-o-user-select: none;
		user-select: none;
	}

	button:hover {
		color: var(--blue-600);
		transition: color 200ms;
	}

	button:hover :global(svg) {
		stroke: var(--blue-600);
		transition: stroke 200ms;
	}

	@media (max-width: 600px) {
		button {
			display: none;
		}
	}

	@media print {
		button {
			display: none;
		}
	}
</style>
