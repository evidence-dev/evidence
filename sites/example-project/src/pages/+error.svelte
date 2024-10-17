<script>
	import { page } from '$app/stores';
	import { Accordion, AccordionItem, CopyButton } from '@evidence-dev/core-components';

	import { browser } from '$app/environment';

	// Remove splash screen from app.html
	if (browser) {
		const splash = document.getElementById('__evidence_project_splash');
		splash?.remove();
	}

	/** @param {Error | unknown} e */
	const expand = (error) => {
		let output = '';
		if (error.stack) {
			output += error.stack;
		}
		if (error.cause) {
			output += '\n\nCaused By:\n\t';
			output += expand(error.cause).split('\n').join('\n\t');
		}
		return output;
	};

	$: expanded = expand($page.error);
</script>

{#if $page.status === 404}
	<h1 class="mt-0 mb-8 py-0">Page Not Found</h1>
	<p>
		<span class="font-mono text-base">{$page.status}</span>: The page
		<span class="font-mono text-base bg-base-200">{$page.url.pathname}</span> can't be found in the project.
	</p>
{:else if $page.status === 500}
	<h1 class="mt-0 mb-8 py-0">Application Error</h1>

	{#if $page.error.message}
		<p class="font-mono text-sm bg-base-200 px-2 py-2">
			<span class="font-mono text-base">{$page.status}</span>:{$page.error.message}
		</p>{/if}
	{#if $page.error.stack || $page.error.cause}
		<Accordion>
			<AccordionItem title="Error Details">
				<div class="relative">
					<span class="absolute top-2 right-2">
						<CopyButton textToCopy={expanded} />
					</span>
					<pre class="font-mono text-sm bg-base-200 px-2 py-2 overflow-auto">{expanded}</pre>
				</div>
			</AccordionItem>
		</Accordion>
	{/if}
{:else}
	<h1>Unknown Error Encountered</h1>
	<span class="font-mono text-base">HTTP {$page.status}</span>
{/if}
