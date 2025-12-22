<script>
	// @ts-check
	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */

	import EnvironmentVarListing from './EnvironmentVarListing.svelte';
	/** @type {DatasourceSpec[]} */
	export let sources;
</script>

<section class="w-full pt-2 pb-10">
	<div class="pb-4">
		<p class="text-base-content mb-4 text-pretty">
			Documentation on deploying Evidence projects to a variety of cloud environments is available <a
				href="https://docs.evidence.dev/deployment/overview/"
				class="markdown"
				target="_blank"
			>
				here.</a
			> For all deployment environments, you will need to set the environment variables using the key
			value pairs below.
		</p>
		<EnvironmentVarListing {sources} />
		<div class="mt-6">
			<p class="text-base-content-muted">
				To use different connection settings your deployment environment,
				<a
					class=" underline underline-offset-2"
					href="https://docs.evidence.dev/deployment/environments"
					target="_blank"
				>
					set different environment variable values in your deployment environment
				</a>
				.
			</p>
		</div>
	</div>
</section>
