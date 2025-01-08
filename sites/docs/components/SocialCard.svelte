<script>
	export let title = 'Evidence';
	export let description = 'Build data apps using SQL and Markdown';
    export let category = 'Evidence Documentation';
</script>

<div class="font-sans flex flex-col w-full h-full bg-[#0a0a0a] text-[#fafafa] p-18 normal grid-background border border-b-[rgba(255,255,255,0.15)] border-r-[rgba(255,255,255,0.15)]">
	<div class="flex flex-col w-full h-full text-2xl">
        <div class="flex items-center">
            <img
                src="https://raw.githubusercontent.com/evidence-dev/media-kit/refs/heads/main/svg/logo-noborder-white.svg"
                alt="Evidence Logo"
                class="h-10 w-10"
            />
            <div class="flex text-4xl ml-8">{category}</div>
        </div>
		<div class="flex flex-col flex-1 h-full my-auto justify-around my-10">
			<div class="text-7xl tight -ml-1 leading-[1.2]">{title}</div>
			<div class="text-4xl -ml-0.5 leading-[1.3]">{description}</div>
		</div>
        <div class="flex items-center justify-between -my-2 opacity-70">
		    <div class="mono text-3xl">DOCS.EVIDENCE.DEV</div>
            <div class="-ml-0.5 text-3xl">Evidence Documentation</div>
        </div>
    </div>
</div>

<style>
    .tight {
        font-family: 'InterTight', sans-serif;
        font-weight: 550;
    }
    
    .normal {
        font-family: 'Inter', sans-serif;
    }

    .grid-background {
        background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px);
        background-size: 63.157px 63.157px; /* = 1200px/19 = 630px/10 */
        background-position: 0 0;
    }

    .mono {
        font-family: 'GTAmericaMono', sans-serif;
    }
</style>
