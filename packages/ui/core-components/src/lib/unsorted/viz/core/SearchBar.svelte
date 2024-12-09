<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Search } from '@steeze-ui/tabler-icons';

	export let placeholder = 'Search';
	export let value;
	export let searchFunction;
</script>

<div class="search-container">
	<input
		class="search-bar"
		type="text"
		{placeholder}
		bind:value
		on:keyup={() => searchFunction(value)}
	/>
	<div class="search-icon">
		<Icon src={Search} class="pl-0.5" />
	</div>
</div>

<style lang="postcss">
	.search-container {
		@apply bg-base-100 border border-base-300;
		width: 30%;
		display: block;
		align-items: center;
		border-radius: 4px;
		height: 22px;
		position: relative;
		margin: 25px 3px 10px 0px;
		box-sizing: content-box;
	}

	.search-icon {
		height: 16px;
		width: 16px;
		padding-left: 3px;
		margin: 0;
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		-ms-transform: translateY(-50%);
		box-sizing: content-box;
	}

	.search-bar {
		@apply bg-base-100;
		margin: 0;
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		-ms-transform: translateY(-50%);

		border: none;
		padding-left: 23px;

		font-size: 9pt;

		width: calc(100% - 10px);

		font-family: Arial;
		line-height: normal;
	}

	input.search-bar::placeholder {
		@apply text-base-content-muted;
	}

	*:focus {
		outline: none;
	}

	@media (max-width: 600px) {
		.search-container {
			width: 98%;
			height: 28px;
		}

		.search-bar {
			font-size: 16px;
			width: calc(100% - 20px);
		}
	}

	@media print {
		.search-container {
			display: none;
		}
	}
</style>
