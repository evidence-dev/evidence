<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/Checkbox',
		argTypes: {
			emptySet: {
				control: 'boolean'
			}
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import Checkbox from './Checkbox.svelte';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	const inputStore = getInputContext();

	let storyIframeURL = '';

	const updateURL = () => {
		storyIframeURL = window.location.href;

		// Try forcing Storybook to recognize the change
		const iframe = document.querySelector('iframe');
		if (iframe) {
			iframe.src = iframe.src; // Force reload
		}
	};

	(function () {
		const pushState = history.pushState;
		const replaceState = history.replaceState;

		history.pushState = function () {
			pushState.apply(history, arguments);
			updateURL();
		};

		history.replaceState = function () {
			replaceState.apply(history, arguments);
			updateURL();
		};

		window.addEventListener('popstate', updateURL);
	})();
</script>

<Story name="Base" let:args>
	<Checkbox title="base checkbox" name="base_checkbox" {...args} />
	<p>{$inputStore.base_checkbox}</p>
</Story>
<Story name="Default String + Boolean False" let:args>
	<Checkbox title="string false" defaultValue="false" name="string_false" {...args} />
	<p>{$inputStore.string_false}</p>
	<Checkbox title="boolean false" defaultValue={false} name="boolean_false" {...args} />
	<p>{$inputStore.boolean_false}</p>
</Story>
<Story name="Default String + Boolean True" let:args>
	<Checkbox title="string true" defaultValue="true" name="string_true" {...args} />
	<p>{$inputStore.string_true}</p>
	<Checkbox title="boolean true" defaultValue={true} name="boolean_true" {...args} />
	<p>{$inputStore.boolean_true}</p>
</Story>
<Story name="URL Params" let:args>
	<Checkbox title="string true" defaultValue="true" name="string_true_url" {...args} />
	<p>{$inputStore.string_true}</p>
	<Checkbox title="boolean true" defaultValue={true} name="boolean_true_url" {...args} />
	<p>{$inputStore.boolean_true}</p>

	<div class="mt-4">URL: {storyIframeURL}</div>
	<button
		class="mt-4 p-1 border bg-info/60 hover:bg-info/40 active:bg-info/20 rounded-md text-sm

	"
		on:click={() => window.open(storyIframeURL, '_blank')}>Go to URL</button
	>
</Story>
