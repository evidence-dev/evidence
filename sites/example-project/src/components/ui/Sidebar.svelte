<script>
    import { page } from '$app/stores';
	import { dev } from '$app/env';

    export let menu 
    export let open 
</script>

<aside class="sidebar" class:open>
    <div class="sticky">
        <div class=nav-header>
            <a href='/'><h1 class=project-title>Evidence</h1></a>
        </div>
        <nav>
            {#if menu}
            {#each menu as item}
                {#if item.label != 'index'}
                <a href={item.href} sveltekit:prefetch >
                    <div class:selected="{"/"+$page.path.split('/')[1] === item.href}" >
                        {item.label}
                    </div>
                </a>
                {/if}
            {/each}
            {/if}
        </nav>
        {#if dev}
        <div class="nav-footer">

            <a href='/settings'>Settings</a>
        </div>
        {/if}
    </div>
</aside>

<style>

aside.sidebar {
    grid-area: sidebar;
    position: relative;
    z-index: 3;
    background-color: var(--grey-100);
    border-right: 1px solid var(--grey-300);
}

.sticky {
    position: sticky;
    top: 0;
    padding: 0;
	height: 100vh;
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 3em 1fr 4em;
	grid-template-areas: 
	'header'
	'nav'
	'footer'
	;
}

nav {
    overflow-y: scroll;
	overflow-x: hidden;
}

a {
	text-transform: capitalize;
	color:var(--grey-800);
	display: inline-block;
	text-decoration: none;
	font-family: var(--ui-font-family);
	-webkit-font-smoothing: antialiased;
}

nav a {
	font-size: 16px;
	display: block;
	color: var(--grey-700);
}

nav div {
	width: 100%;
	padding: 0.2em 1em 0.2em 1em;
	/* transition-property: background-color;
	transition-duration: 400ms; */
}

nav div:hover {
	background-color: var(--grey-200);
	/* transition-property: background-color;
	transition-duration: 400ms; */
}

nav div:active {
	background-color: var(--grey-300);
}

nav a:hover {
	text-decoration: none;
	background-color: none;
	text-decoration: none;
}

div.selected {
	background-color: var(--grey-200);
	color: var(--grey-999);
	font-weight: 500;

}

div.nav-header {
	padding: 0.2em 1em 1.2em 1em;
	grid-area: header;
}

div.nav-header a {
	display: block;
}

.nav-footer {
	padding: 1.2em 1em 1.2em 1em;
	box-sizing: border-box;

	position:absolute; 
	bottom:0;
	height:100%;
	width: 100%;
	border-top: 1px solid var(--grey-200);
	grid-area:footer;
}

.nav-footer a {
	display:block
}

@media (max-width: 850px) {
	aside.sidebar {
		grid-area: none; 
		position: fixed;
		height: 100%;
		width: 100%; 
		left: -100%;
		transition: left 0.3s ease-in-out; 	
		background-color: hsla(217, 33%, 97%, .83);
		-webkit-backdrop-filter: blur(20px) saturate(1.8);
		backdrop-filter: blur(20px) saturate(1.8);
		border-right: 1px solid var(--grey-300);		
	}

	aside.open {
		left: 0;
	}

	div.nav-footer {
		display: none 
	}

}

</style>