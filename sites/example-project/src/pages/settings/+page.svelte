<script>
	// @ts-check

	/** @type {import("./$types").PageData} */
	export let data;
	let { settings, customFormattingSettings, sources, plugins } = data;
	$: ({ settings, customFormattingSettings, sources, plugins } = data);

	import { dev } from '$app/environment';
	import {
		DeploySettingsPanel,
		FormattingSettingsPanel,
		TelemetrySettingsPanel,
		SourceConfig
	} from '@evidence-dev/core-components';
</script>

{#if dev}
	<div
		class="fixed top-12 left-0 right-0 bg-base-100 z-40 py-6 border-b border-base-200 bg-base-100/90 backdrop-blur"
	>
		<div class="max-w-7xl px-6 sm:px-8 md:px-12 mx-auto">
			<a href="/" class="block text-sm text-base-content-muted mb-2"> &larr; Home </a>
			<h1 class="text-xl text-base-content font-bold">Project Settings</h1>
		</div>
	</div>

	<div class="flex pt-28">
		<div class="w-full relative flex overflow-x-hidden">
			<div class="fixed w-60 top-48 hidden lg:block">
				<div class="flex flex-col gap-4 text-sm text-base-content-muted">
					<a href="#sources" class="hover:text-base-content transition-colors">Sources</a>
					<a href="#deployment" class="hover:text-base-content transition-colors">Deployment</a>
					<a href="#formatting" class="hover:text-base-content transition-colors"
						>Value Formatting</a
					>
					<a href="#telemetry" class="hover:text-base-content transition-colors">Telemetry</a>
				</div>
			</div>
			<div class="flex flex-col lg:ml-60 lg:px-8 gap-12 w-full overflow-x-auto">
				<section id="sources" class="scroll-mt-48">
					<div class="mb-6">
						<h2 class="text-2xl text-base-content font-semibold mb-4 text-pretty">Sources</h2>
						<p class="text-base-content text-base mb-2">
							Sources connect your Evidence project to databases, local files, and APIs. Each source
							creates a directory in your project under <code class="markdown">/sources</code> where
							you can add queries.
							<a
								href="https://docs.evidence.dev/core-concepts/data-sources/"
								target="_blank"
								class="markdown"
							>
								Learn more about sources.
							</a>
						</p>
					</div>
					<SourceConfig availableSourcePlugins={plugins} {sources} />
				</section>
				<section id="deployment" class="scroll-mt-[9.5rem] border-t border-base-300 pt-8">
					<div class="mb-6">
						<h2 class="text-2xl text-base-content font-semibold mb-4">Deployment</h2>
						<p class="text-base-content text-base mb-2">
							Evidence projects can be deployed to a variety of cloud environments. The easiest way
							to deploy your project with authentication, scheduled updates, and a custom domain is with Evidence Cloud.
							<a
								href="https://docs.evidence.dev/deployment/overview/"
								target="_blank"
								class="markdown">Learn more about deployment.</a
							>
						</p>
					</div>
					<DeploySettingsPanel {settings} {sources} />
				</section>
				<section id="formatting" class="scroll-mt-[9.5rem] border-t border-base-300 pt-8">
					<div class="mb-6">
						<h2 class="text-2xl text-base-content font-semibold mb-4">Value Formatting</h2>
						<p class="text-base-content text-base mb-2">
							Evidence supports built-in formats and Excel-style formats. You can apply these
							formats using component props or SQL format tags.
							<a
								href="https://docs.evidence.dev/core-concepts/formatting/"
								target="_blank"
								class="markdown"
							>
								Learn more about formatting.
							</a>
						</p>
					</div>
					<FormattingSettingsPanel {customFormattingSettings} />
				</section>
				<section id="telemetry" class="scroll-mt-[9.5rem] border-t border-base-300 pt-8">
					<div class="mb-6">
						<h2 class="text-2xl text-base-content font-semibold mb-4">Telemetry</h2>
						<p class="text-base-content text-base mb-2">
							The Evidence CLI collects anonymous usage data to help us understand how often the
							tool is being used. <a
								href="https://github.com/evidence-dev/evidence/tree/next/packages/lib/telemetry"
								target="_blank"
								class="markdown"
							>
								View telemetry source code.
							</a>
						</p>
					</div>
					<TelemetrySettingsPanel {settings} />
				</section>
			</div>
		</div>
	</div>
{:else}
	<p>Settings are only available in development mode.</p>
{/if}
