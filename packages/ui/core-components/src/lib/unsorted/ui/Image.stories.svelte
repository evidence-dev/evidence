<script context="module">
	import Image from './Image.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'UI/Image',
		component: Image
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
</script>

<Story name="All">
	<Image
		url="https://images.ctfassets.net/h8q6lxmb5akt/3Zw55bT90zpKWbS26VNOBp/7732c3d8bd6f0994db10c14c8e789057/raptors-logo-original-1995.svg"
	/>
</Story>
