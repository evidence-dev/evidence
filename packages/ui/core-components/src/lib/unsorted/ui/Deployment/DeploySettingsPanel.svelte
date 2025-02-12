<script>
	// @ts-check
	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */

	import CopyEnvironmentVariables from './CopyEnvironmentVariables.svelte';
	import EnvironmentVarListing from './EnvironmentVarListing.svelte';
	/** @type {DatasourceSpec[]} */
	export let sources;
</script>

<section class="w-full pt-2 pb-10">
	<div class="pb-4">
		<h3 class="text-base-content text-lg font-semibold mt-0 mb-5">Evidence Cloud</h3>
		<!-- <ul>
			<li>Host your project at <code>{'<'}project-name{'>'}.evidence.app</code></li>
			<li>Authenticate users</li>
			<li>Schedule updates to your data</li>
			<li>Re-build when you push changes to your project</li>
		</ul> -->
		<div class="flex gap-4 items-center">
			<div
				class="flex items-center justify-center text-base-content font-bold border border-base-300 w-8 h-8 rounded-full shadow-sm tabular-nums"
			>
				1
			</div>
			<h4 class="font-bold text-base-content">Check your project into version control</h4>
		</div>
		<div class="pl-8 ml-[calc(1rem-0.5px)] pt-1 pb-10 border-l border-base-200">
			<p>
				Evidence Cloud deploys your project from its Github repository. As you make changes to your
				project and commit them to main, Evidence cloud will update your deployed project.
			</p>
		</div>
		<div class="flex gap-4 items-center">
			<div
				class="flex items-center justify-center text-base-content font-bold border border-base-300 w-8 h-8 rounded-full shadow-sm tabular-nums"
			>
				2
			</div>
			<h4 class="font-bold text-base-content">Sign in to Evidence Cloud</h4>
		</div>
		<div class="pl-8 ml-[calc(1rem-0.5px)] pt-1 pb-10 border-l border-base-200">
			<p>
				Sign into Evidence Cloud using your GitHub account and add a new project. Follow the steps
				to connect to your Github repository.
			</p>
			<a
				href="https://evidence.app"
				target="_blank"
				class="inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-300 disabled:pointer-events-none disabled:opacity-50 mt-4 w-full h-10 px-10 text-sm w-full bg-base-content text-base-100 shadow-sm hover:bg-base-content/90 active:bg-base-content/80"
				>Sign In</a
			>
		</div>
		<div class="flex gap-4 items-center">
			<div
				class="flex items-center justify-center text-base-content font-bold border border-base-300 w-8 h-8 rounded-full shadow-sm tabular-nums"
			>
				3
			</div>

			<h4 class="font-bold text-base-content">Set your Project Environment Variables</h4>
		</div>
		<div class="pl-8 ml-[calc(1rem-0.5px)] pt-1 pb-10 border-l border-base-200">
			<p>
				While you are setting up your cloud project, you'll be prompted for your environment
				variables to connect Evidence cloud to your sources. Copy them here.
			</p>
			<CopyEnvironmentVariables {sources} />
			<div class="mt-4">
				<p class="text-base-content-muted">
					To use different connection settings your other deployment environment,
					<a
						class=" underline underline-offset-2"
						href="https://docs.evidence.dev/deployment/environments"
						target="_blank"
					>
						set different environment variable values in cloud
					</a>
					.
				</p>
			</div>
		</div>
		<div class="flex gap-4 items-center">
			<div
				class="flex items-center justify-center text-base-content font-bold border border-base-300 w-8 h-8 rounded-full shadow-sm tabular-nums"
			>
				4
			</div>

			<h4 class="font-bold text-base-content">Done</h4>
		</div>
		<div class="pl-8 ml-[calc(1rem-0.5px)] pt-1 pb-4 border-l border-base-200">
			<p>
				When you make changes to your project locally, push them to main, and Evidence cloud will
				update your deployed project.
			</p>
		</div>
		<h3 class="text-base-content text-lg font-semibold mt-0 mb-4 mt-8">Other Environments</h3>
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
