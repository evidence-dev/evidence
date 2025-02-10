<script>
	import Accordion from '$lib/atoms/accordion/Accordion.svelte';
	import AccordionItem from '$lib/atoms/accordion/AccordionItem.svelte';
	import Switch from '$lib/atoms/switch/Switch.svelte';
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	export let settings;
	let usageStats = (settings.send_anonymous_usage_stats ?? 'yes') === 'yes';

	async function save() {
		settings.send_anonymous_usage_stats = usageStats ? 'yes' : 'no';
		await fetch(addBasePath('/api/settings.json'), {
			method: 'POST',
			body: JSON.stringify({
				settings
			})
		});
	}
</script>

<div>
	<Accordion>
		<AccordionItem title="Options">
			<p class="markdown mb-1 text-pretty">
				Sharing anonymous CLI usage data is one of the best ways you can support Evidence.
			</p>
			<form id="telemetry">
				<label
					for="telemetry-toggle"
					class="flex justify-between gap-2 items-center pt-4 mt-4 font-medium"
				>
					Share anonymous usage data
					<Switch id="telemetry-toggle" bind:checked={usageStats} on:change={save}></Switch>
				</label>
			</form>
		</AccordionItem>
	</Accordion>
</div>
