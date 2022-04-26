<script>
    import BreadCrumbs from './BreadCrumbs.svelte';
</script>

<header>
    <div class="breadcrumb-container">
        <BreadCrumbs/>
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

div.breadcrumb-container {
	height: var(--header-height);
	box-sizing: border-box;
	display: flex;
	justify-items: right;
	align-items: center; 
}

</style>