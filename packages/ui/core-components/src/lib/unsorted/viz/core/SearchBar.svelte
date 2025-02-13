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

<div class="search-container bg-base-100 border border-base-300 shadow-sm h-7 rounded-md mb-1 mr-1">
	<input
		class="search-bar bg-base-100 placeholder:text-base-content-muted/80"
		type="text"
		{placeholder}
		bind:value
		on:keyup={() => searchFunction(value)}
	/>
	<div class="search-icon text-base-content-muted/80">
		<Icon src={Search} class="pl-0.5" />
	</div>
</div>

<style>
	.search-container {
		width: 30%;
		display: block;
		align-items: center;
		position: relative;
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
