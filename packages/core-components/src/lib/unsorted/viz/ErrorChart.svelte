<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { dev } from '$app/environment';
	export let error;
	export let chartType;

	const MissingCredentialsError = 'SQL Error: Missing database credentials';
</script>

<div
	width="100%"
	class="grid grid-rows-auto box-content grid-cols-1 justify-center bg-red-50 text-grey-700 font-ui font-normal rounded border border-red-100 min-h-[150px] py-5 px-8 my-5 print:break-inside-avoid"
>
	<div class="m-auto w-full">
		<div class="font-bold text-center text-lg">{chartType}</div>
		<div
			class="text-center [word-wrap:break-work] text-xs"
			class:w-[7.8em]={chartType.includes('Value')}
		>
			{error}
			{#if dev && error === MissingCredentialsError}
				<br /><a class="credentials-link" href="/settings"> Add&nbsp;credentials&nbsp;&rarr;</a>
			{/if}
		</div>
	</div>
</div>
