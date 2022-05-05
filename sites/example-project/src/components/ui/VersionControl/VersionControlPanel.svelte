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
            {#if settings.localGitRepo}
                <span class=gitcheck-icon>
                <IoIosCheckmarkCircle/>
                </span>
            {:else}
                <span class=gitx-icon>
                <IoIosCloseCircle/>
                </span>
            {/if}
            <span class=item-label>Local Git Repo</span>
            {#if settings.localGitRepo}
                <div class=result-msg>
                    <span class=repo-location>Tracking {settings.localGitRepo}</span>  
                </div>
            {:else}
            <span class=help-icon>
                <IoIosHelpCircleOutline/>
                <span class=info-msg>Version control on your local computer. Initialize a repository through your code editor or run `git init` in a terminal. If you are using VS Code, this can be done from the Source Control tab.</span>
            </span>
            {/if}
        </div>

        <div class=git-item>
            {#if settings.gitRepo}
                <span class=gitcheck-icon>
                <IoIosCheckmarkCircle/>
                </span>
            {:else}
                <span class=gitx-icon>
                <IoIosCloseCircle/>
                </span>
            {/if}   
            <span class=item-label>Remote Git Repo</span>
            {#if settings.gitRepo}
            <div class=result-msg>
                <a href={settings.gitRepo.replace(".git", "")} target="_blank"><span class=repo-location>{settings.gitRepo.replace(".git", "")}</span></a>  
            </div>
            {:else}
            <span class=help-icon>
                <IoIosHelpCircleOutline/>
                <span class=info-msg>Publish your git repo to GitHub or GitLab. If you are using VS Code, this can be done from the Source Control tab.</span>
            </span>
            {/if}
        </div>
    </div>

</div>
<footer>
    <span>New to git? <a class=docs-link href="https://docs.evidence.dev/walkthroughs/version-control"> See detailed instructions in the docs &rarr;</a></span> 
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
        float: right;
        width: 25px;
        vertical-align: middle;
        line-height: 1em;
        position:relative;
        text-transform: none;
        margin-right: 5px;
    }

    .gitx-icon {
        color: var(--red-700);
        width: 25px;
        float: right;
        vertical-align: middle;
        line-height: 1em;
        position:relative;
        text-transform: none;
        margin-right: 5px;
    }

    .git-item {
        margin-top: 18px;
        margin-bottom: 10px;
    }

    .result-msg {
        word-break: break-all;
        margin-top: 3px;
    }

    .repo-location {
        color: var(--grey-500);
        font-size: 0.8rem;
        text-decoration: unset;
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


    .help-icon .info-msg {
        visibility: hidden;
        display: none;
        position: absolute;
        top: -5px;
        left: 105%;
        padding-left: 5px;
        padding-right: 5px;     
        padding-top: 2px;
        padding-bottom: 1px;   
        color: white;
        font-family: sans-serif;
        font-size: 0.8em;
        background-color: var(--grey-900);
        opacity: 0.85;
        border-radius: 6px;
        z-index: 1;
        max-width: 200px;
        min-width: 150px;
    }

    .help-icon:hover .info-msg {
        visibility: visible;
        display: inline;
    }


</style>