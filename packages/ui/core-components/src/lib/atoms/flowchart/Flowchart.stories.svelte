<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Viz/Diagrams/Flowchart',
		component: Flowchart
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import Flowchart from './Flowchart.svelte';
</script>

<Story name="Basic Usage">
	This uses the slot, because the chart source does not contain invalid svelte characters
	<Flowchart>flowchart TD Start --> Stop</Flowchart>
</Story>
<Story name="Advanced Usage">
	This uses the `chart` prop, because the chart source contains invalid svelte characters
	<Flowchart
		chart={`
---
title: Animal example
---
classDiagram
note "From Duck till Zebra"
Animal <|-- Duck
note for Duck "can fly\\ncan swim\\ncan dive\\ncan help in debugging"
Animal <|-- Fish
Animal <|-- Zebra
Animal : +int age
Animal : +String gender
Animal: +isMammal()
Animal: +mate()
class Duck{
    +String beakColor
    +swim()
    +quack()
}
class Fish{
    -int sizeInFeet
    -canEat()
}
class Zebra{
    +bool is_wild
    +run()
}        
    `}
	/>
</Story>

<Story name="Multiple Charts">
	<Flowchart>flowchart TD Start --> Stop</Flowchart>
	<Flowchart>flowchart TD Stop --> Start</Flowchart>
</Story>
