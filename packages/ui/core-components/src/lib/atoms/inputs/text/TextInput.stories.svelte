<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/TextInput',
		component: TextInput,
		argTypes: {},
		args: { title: 'Search Enabled Text Input', name: 'textInput' }
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import TextInput from './TextInput.svelte';
	// From layout.js
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	// import {
	// 	displayedStoryURL,
	// 	initStorybookURLWatcher
	// } from '/home/kylew/projects/evidence/evidence/packages/lib/sdk/src/utils/svelte/storybookURLWatcher.js';

	const inputStore = getInputContext();

	// initStorybookURLWatcher(); // Start watching for URL changes

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

<Template let:args>
	<div class="h-64">
		<TextInput {...args} />
		<p class="font-bold text-lg mt-4">Output Attributes</p>
		<dl>
			<dt class="font-bold">$inputStore.textInput</dt>
			<dd class="ml-4">{$inputStore.textInput}</dd>
			<dt class="font-bold">$inputStore.textInput.sql</dt>
			<dd class="ml-4">{$inputStore.textInput?.sql}</dd>
			<dt class="font-bold">$inputStore.textInput?.search?.("column name")</dt>
			<dd class="ml-4">{$inputStore.textInput?.search?.('column name')}</dd>
		</dl>
	</div>
</Template>

<Story name="Default" />

<Story name="URL Params">
	<TextInput name="URLParams" title="update url params" />
	<div>URL: {storyIframeURL}</div>
	<button
		class="mt-4 p-1 border bg-info/60 hover:bg-info/40 active:bg-info/20 rounded-md text-sm

	"
		on:click={() => window.open(storyIframeURL, '_blank')}>Go to URL</button
	></Story
>
