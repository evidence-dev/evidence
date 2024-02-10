<script context="module">
	export const evidenceInclude = true;
</script>

<script>
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { registerTheme, init } from 'echarts';
    import { evidenceThemeLight } from '@evidence-dev/component-utilities/echartsThemes';
	import replaceNulls from '@evidence-dev/component-utilities/replaceNulls';

    export let config = undefined;
    export let echartsOptions = undefined;
	export let height = '291px';
	export let width = '100%';

    let instance;
    let container;
    let svgMarkup = ''; // For storing the SVG markup

    let setWidth;

    registerTheme('evidence-light', evidenceThemeLight);

    if (!browser) {
        // SSR-specific initialization
        instance = init(null, 'evidence-light', {
            ssr: true,
            renderer: "svg",
			height: Number(height.replace('px','')),
			width: 736
        });
        instance.setOption({...config, animation: false});
        if(echartsOptions){
            instance.setOption(echartsOptions)
        }
        svgMarkup = instance.renderToSVGString();
        instance.dispose(); // Dispose instance after generating SVG
    }

    // onMount(() => {
    //     if (browser) {
    //         // Client-side specific initialization
    //         instance = init(container, 'evidence-light', {
    //             ssr: false,
    //             renderer: 'svg'
    //         });
    //         instance.setOption({...config, animation: false});
    //     }
    // });

    onDestroy(() => {
        if (instance) {
            instance.dispose();
        }
    });
</script>

<svelte:window on:resize={() => instance?.resize()} />

<div bind:this={container} 
    class="max-w-[100%]"
    style="
    height: {height};
    width: 100%;
    margin-left: 0;
    margin-top: 15px;
    margin-bottom: 10px;
    overflow: visible;"
>
    {@html svgMarkup}
</div>