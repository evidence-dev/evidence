<script>
    import IoIosCheckmarkCircle from 'svelte-icons/io/IoIosCheckmarkCircle.svelte'
    import IoIosCloseCircle from 'svelte-icons/io/IoIosCloseCircle.svelte'
    import IoIosHelpCircleOutline from 'svelte-icons/io/IoIosHelpCircleOutline.svelte'
    export let settings

</script>

<form>


<div class=container>

    <div class=panel> 
    <h1>Version Control</h1>
        <div class=git-item>
            {#if settings.localGiftRepo}
                <span class=gitcheck-icon>
                <IoIosCheckmarkCircle/>
                </span>
            {:else}
                <span class=gitx-icon>
                <IoIosCloseCircle/>
                </span>
            {/if}
            <span class=item-label>Local Git Repo</span>
            {#if settings.localGiftRepo}
                <div class=result-msg>
                    <span class=repo-location>Tracking {settings.localGitRepo}</span>  
                </div>
            {/if}
        </div>

        <div class=git-item>
            {#if settings.gitRfepo}
                <span class=gitcheck-icon>
                <IoIosCheckmarkCircle/>
                </span>
            {:else}
                <span class=gitx-icon>
                <IoIosCloseCircle/>
                </span>
            {/if}   
            <span class=item-label>Remote Git Repo</span>
            {#if settings.gitRfepo}
            <div class=result-msg>
                <span class=repo-location>{settings.gitRepo}</span>  
            </div>
            {:else}
            <span class=help-icon>
                <IoIosHelpCircleOutline/>
            </span>
            {/if}
        </div>
    </div>

</div>
<footer>
    <span>Learn more about <a class=docs-link href="https://docs.evidence.dev/version-control"> Setting Up Version Control &rarr;</a></span> 
</footer>
</form>
<style>

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

    .docs-link {
        color: var(--blue-600);
        text-decoration: none;
    }

    .docs-link:hover {
        color: var(--blue-800);
    }

    .gitcheck-icon {
        color: var(--green-700);
        width: 22px;
        display:inline-block;
        vertical-align: middle;
        line-height: 1em;
        position:relative;
        text-transform: none;
    }

    .gitx-icon {
        color: var(--red-700);
        width: 22px;
        display:inline-block;
        vertical-align: middle;
        line-height: 1em;
        cursor: help;
        position:relative;
        text-transform: none;
    }

    .git-item {
        margin-top: 15px;
    }

    .result-msg {
        word-break: break-all;
        margin-top: 3px;
    }

    .repo-location {
        color: var(--grey-500);
        font-size: 0.8rem;
    }

    .item-label {
        /* font-weight: 600; */
        color: var(--grey-800);
        text-transform: uppercase;
    }

    .help-icon {
        width: 18px;
        color:var(--grey-600);
        display:inline-block;
        vertical-align: middle;
        line-height: 1em;
        cursor: help;
        position:relative;
        text-transform: none;
    }

</style>