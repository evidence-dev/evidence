<script>
	import ButtonGroup from './ButtonGroup.svelte';
	import ButtonGroupItem from './ButtonGroupItem.svelte';
	export let name;
</script>

<ButtonGroup {name}>
	<ButtonGroupItem label="Week" value="7 days" />
	<ButtonGroupItem label="Month" value="1 month" />
	<ButtonGroupItem label="Year" value="1 year" />
</ButtonGroup>
