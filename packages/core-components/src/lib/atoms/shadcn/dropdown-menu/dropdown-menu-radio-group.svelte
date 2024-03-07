<script>
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	/** @type {any} */
	export let value = undefined;
</script>

<DropdownMenuPrimitive.RadioGroup {...$$restProps} bind:value>
	<slot />
</DropdownMenuPrimitive.RadioGroup>
