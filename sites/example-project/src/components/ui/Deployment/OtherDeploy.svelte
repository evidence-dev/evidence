<script>
    import EnvironmentVarListing from "./EnvironmentVarListing.svelte";
    import VariableCopy from "./VariableCopy.svelte";
    import Separator from "$lib/ui/system/Separator.svelte";
    export let settings
</script>

<h1>Deploying your Project</h1>

<p>
    In production, Evidence functions like a static site generator: 
</p>
<ol>
    <li>Running <code>npm run build</code> will build a static site in the <code>/build</code> directory which you can host in a variety of environments</li>
    <li>You can share your database credentials with your production environment by setting the environment variables listed below</li>
</ol>

<Separator>Building Your Project</Separator>

<div class='setting-row'>
    <span class='setting'>Build command</span>
    <div class='setting-value'><VariableCopy text={'npm run build'}/></div>
</div>

<div class='setting-row'>
    <span class='setting'>Publish directory</span>  
    <div class='setting-value'><VariableCopy text={'build/'}/> </div>
    
</div>

<Separator>Environment Variables</Separator>
<p>The following environment variables must be present in your deployment environment to enable your database connection</p>

{#if !settings.credentials}

<p>Your project does not have a database connection.</p>

{:else}

<EnvironmentVarListing {settings}/>

{/if}

<style>
    span.setting {
        font-size: 0.85em;
        color: var(--grey-800);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    div.setting-row {
        margin-top: 1.25em;
    }

    div.setting-row:first-of-type {
        margin-top: 0em;
    }

    div.setting-value {
        margin-top: 0.25em;
        width: 45%;
    }

</style>
