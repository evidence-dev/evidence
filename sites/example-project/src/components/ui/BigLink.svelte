<script>
    export let href
</script>

<a {href}>
    <div>
    <span class=content>
        <slot/>
        &rarr;
    </span>
    </div>    
</a>

<style>
    div {
        border: 1px solid var(--grey-200);
        border-radius: 6px;
        padding: 0.3em 0.6em;
        font-family: var(--ui-font-family);
        font-size: 0.95em;
        margin-top:1em;
        margin-bottom:1.25em;
        box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
        cursor: pointer;
        transition: all 400ms;
    }

    a {
        text-decoration: none;
        color: var(--blue-700);

    }

    a:hover {
        text-decoration: none;
        color: var(--blue-800);

    }

    div:hover { 
        border: 1px solid var(--grey-300);
        transition: all 400ms;


    }

</style>