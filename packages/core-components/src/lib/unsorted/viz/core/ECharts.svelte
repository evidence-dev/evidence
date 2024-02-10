<script context="module">
	export const evidenceInclude = true;
</script>

<script>
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { registerTheme, init } from 'echarts';
    import { evidenceThemeLight } from '@evidence-dev/component-utilities/echartsThemes';

    export let config = undefined;

    let instance;
    let container;
    let svgMarkup = ''; // For storing the SVG markup

    registerTheme('evidence-light', evidenceThemeLight);

    if (!browser) {
        // SSR-specific initialization
        instance = init(null, 'evidence-light', {
            ssr: true,
            renderer: "svg",
			height: 300,
			width: 800
        });
        instance.setOption(config);
        svgMarkup = instance.renderToSVGString();
        instance.dispose(); // Dispose instance after generating SVG
    }

    onMount(() => {
        if (browser) {
            // Client-side specific initialization
            instance = init(container, 'evidence-light', {
                ssr: false,
                renderer: 'svg'
            });
            instance.setOption({...config, animation: false});
        }
    });

    onDestroy(() => {
        if (instance) {
            instance.dispose();
        }
    });
</script>

<svelte:window on:resize={() => instance?.resize()} />

<div bind:this={container} style="height: 300px; width: 100%;">
    {@html svgMarkup}
</div>