<script>
    export let settings
    let usageStats = settings.send_anonymous_usage_stats

    async function save() {
        settings.send_anonymous_usage_stats = usageStats
        const submitted = await fetch("/api/settings.json", {
			method: "POST",
			body: JSON.stringify({
                settings
			})
		})
        // reset the state of settings 
        settings = await submitted.json()
        existingCredentials = settings.credentials
    }
</script>

<form>
<div class=container>
    <div class=panel> 
        <label class="switch">
            <input type="checkbox" bind:checked={usageStats} on:change={save}/>
            <span class="slider" />
        </label>
    </div>

    {settings.send_anonymous_usage_stats}

</div>
<footer>
    <span>Learn more about <a class=docs-link href="https://docs.evidence.dev/deployment/deployment-overview">Deploying your Project &rarr;</a></span>
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


    .switch {
      position: relative;
      display: inline-block;
      width: 2.8rem;
      height: 1.75rem;
      margin-left: auto;
      margin-right: 2px;
      user-select: none;
    }
  
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
  
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      -webkit-transition: 0.4s;
      transition: 0.4s;
      border-radius: 25px;
    }
  
    .slider:before {
      position: absolute;
      content: "";
      height: 1.25rem;
      width: 1.25rem;
      left: 4px;
      bottom: 4px;
      background-color: white;
      -webkit-transition: 0.4s;
      transition: 0.4s;
      border-radius: 50%;
      box-shadow: 0px 1px 2px var(--grey-500);

    }
  
    input:checked + .slider {
      background-color: var(--green-500);
    }

    input:checked + .slider:before {
      -webkit-transform: translateX(1.1rem);
      -ms-transform: translateX(1.1rem);
      transform: translateX(1.1rem);
    }
</style>