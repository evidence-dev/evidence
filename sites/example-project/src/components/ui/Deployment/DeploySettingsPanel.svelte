<script>
    export let settings
    import NetlifyDeploy from "./NetlifyDeploy.svelte";

</script>

<form>


<div class=container>

    <div class=panel> 
    <h1>Deployment</h1>
    <NetlifyDeploy {settings} />
    </div>
</div>
<footer>

</footer>
</form>
<style>
    select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;   
        padding:0.75em;
        width: 100%;
        border: 1px solid var(--grey-200); 
        font-family: var(--ui-font-family);
        color: var(--grey-800); 
        margin: 0.5em 0 0 0; 
        transition: all 400ms;
        cursor: pointer;
    }

        select:hover{
            border: 1px solid var(--grey-300);
            transition: all 400ms;
            box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
    }

        select:focus {
            outline: none;

    }

    .container {
        margin-top: 2em;
        border-top: 1px solid var(--grey-200);
        border-left: 1px solid var(--grey-200);
        border-right: 1px solid var(--grey-200);
        border-radius: 5px 5px 0 0;
        font-size: 14px; 
        font-family: var(--ui-font-family);
    }   

    .panel {
        border-top: 1px solid var(--grey-200);
        padding:1.0em;
    }

    .panel:first-of-type {
        border-top:none;
    }

    footer {
        border: 1px solid var(--grey-200);
        border-radius: 0 0 5px 5px;
        background-color: var(--grey-100);
        padding:1.0em;
        display:flex;
        font-size: 14px;
        align-items: center;
        font-family: var(--ui-font-family);
    }

</style>