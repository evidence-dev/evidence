<script>
    import BreadCrumbs from './BreadCrumbs.svelte';
</script>

<header>
    <div class="grid">
        <div class="breadcrumb-container">
            <BreadCrumbs/>
        </div>
    </div>
    <div class=settings-box>
        
    </div>
</header>

<style>
header {
    grid-area: header;
    position: sticky;
    z-index: 2;
    top: 0;
    height: var(--header-height);
    background-color: rgba(255, 255, 255, 0.73);
    -webkit-backdrop-filter: blur(20px) saturate(1.8);
    backdrop-filter: blur(20px) saturate(1.8);
}

div.grid {
    margin: auto;
    max-width:100ch;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 4fr minmax(0,1fr);
    gap: 0 5ch;
    grid-template-areas:
        'above-article above-toc'; 
    justify-items: left;
    align-items: center;
}

div.breadcrumb-container {
	max-width: 70ch;
	min-width: 0;
	width: 100%;
	height: var(--header-height);
	border-bottom: 1px solid var(--grey-100);
	grid-area: above-article ;
	box-sizing: border-box;
	display: flex;
	justify-items: right;
	align-items: center; 
}
</style>