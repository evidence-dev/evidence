<script>
    import BreadCrumbs from './BreadCrumbs.svelte';
    import PrintButton from './PrintButton.svelte';
    export let menu;
    export let folderList;
</script>

<header>
    <div class="breadcrumb-container">
        <BreadCrumbs {menu} {folderList}/>
        <PrintButton/>
    </div>
</header>

<style>
header {
    grid-area: header;
    height: var(--header-height);
    width: 100%;
}

div.breadcrumb-container {
	height: var(--header-height);
	box-sizing: border-box;
	display: flex;
	justify-items: right;
	align-items: center; 
}

@media print {
    header {
      display: none;
    }
}

</style>