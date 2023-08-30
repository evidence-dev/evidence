<script>
	import { page } from '$app/stores';
	import { Accordion, AccordionItem, CopyButton } from '@evidence-dev/core-components';

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
</script>

<h1 class="my-0 py-0">Error: {$page.status}</h1>
{#if $page.status === 404}
	<h2 class="mt-0 mb-8 py-0">Page Not Found</h2>
	<p>
		The page <span class="font-mono text-base bg-gray-200">{$page.url.pathname}</span> does not exist
		in this project.
	</p>
{:else if $page.status === 500}
	<h2 class="mt-0 mb-8 py-0">Application Error</h2>

	{@const e = $page.error}
	{#if e.message} <p class="font-mono text-sm bg-gray-200 px-2 py-2">{e.message}</p>{/if}
	{#if e.stack || e.cause}
		<Accordion>
			<AccordionItem title="Error Details">
				{@const expanded = expand(e)}
				<div class="relative">
					<span class="absolute top-2 right-2">
						<CopyButton textToCopy={expanded} />
					</span>
					<pre class="font-mono text-sm bg-gray-200 px-2 py-2 overflow-auto">{expanded}</pre>
				</div>
			</AccordionItem>
		</Accordion>
	{/if}
{:else}
	<h2>Unknown Error Encountered</h2>
{/if}
