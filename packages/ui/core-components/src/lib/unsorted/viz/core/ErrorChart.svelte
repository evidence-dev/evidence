<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { dev } from '$app/environment';
	import { buildUrl } from '@evidence-dev/sdk/utils/svelte';
	export let error;
	export let chartType;
	export let minHeight = '150';

	const DevMissingCredentialsError = 'SQL Error: Missing datasource connection.';
	const ProdMissingCredentialsError =
		'SQL Error: Missing database connection; set the EVIDENCE_DATABASE environment variable.';
</script>

<div
	width="100%"
	class="grid grid-rows-auto box-content grid-cols-1 justify-center bg-red-50 text-grey-700 font-ui font-normal rounded border border-red-200 min-h-[{minHeight}px] py-5 px-8 my-5 print:break-inside-avoid relative z-[500]"
>
	<div class="m-auto w-full">
		<div class="font-bold text-center text-lg">
			{chartType}
		</div>
		<div class="text-center [word-wrap:break-work] text-xs">
			{error}
			{#if dev && error === DevMissingCredentialsError}
				<br /><a class="credentials-link" href={buildUrl('/settings')}>
					Add&nbsp;credentials&nbsp;&rarr;</a
				>
			{:else if !dev && error === ProdMissingCredentialsError}
				<br /><a
					class="credentials-link"
					href="https://docs.evidence.dev/cli/#environment-variables"
					>View&nbsp;environment&nbsp;variables&nbsp;&rarr;</a
				>
			{/if}
		</div>
	</div>
</div>

<style>
	.credentials-link {
		color: var(--blue-500);
		text-decoration: none;
	}

	.credentials-link:hover {
		color: var(--blue-700);
	}
</style>
