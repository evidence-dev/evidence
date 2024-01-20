<script>
	export let value;
	export let title;
	export let loading;
</script>

<label class="block w-full">
	<span class="text-sm text-gray-500 block">{title}</span>
	<select
		bind:value
		class="w-full border border-gray-300 bg-white rounded-lg p-1 mt-2 px-2 pr-5 flex flex-row items-center bg-transparent cursor-pointer bg-right bg-no-repeat"
		style="background-image: url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' class=\'icon icon-tabler icon-tabler-chevron-down\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' stroke-width=\'2\' stroke=\'currentColor\' fill=\'none\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath stroke=\'none\' d=\'M0 0h24v24H0z\' fill=\'none\'/%3E%3Cpath d=\'M6 9l6 6l6 -6\' /%3E%3C/svg%3E');"
		disabled={loading}
	>
		{#if loading} <option disabled>Loading</option> {:else} <slot /> {/if}
	</select>
</label>
