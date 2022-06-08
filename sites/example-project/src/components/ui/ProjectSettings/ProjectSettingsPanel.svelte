<script>
	import { projectName } from "../stores";

    async function save() {
        const submitted = await fetch("/api/project.json", {
			method: "POST",
			body: JSON.stringify(
                {name: $projectName}
			)
		})
    }
</script>

<form>
	<div class="container">
		<div class="panel">
			<h1>Project settings</h1>
			<div class="input-item">
				<label for="project-name"> name </label>
				<input type=text bind:value={$projectName} on:change={save} id="project-name" />
			</div>
			<p class="note">
				Displayed in the top left corner on the sidebar
			</p>
		</div>
	</div>
</form>

<style>
	.container {
		margin-top: 2em;
		border: 1px solid var(--grey-200);
		border-radius: 5px;
		font-size: 14px;
		font-family: var(--ui-font-family);
	}

	.panel {
		border-top: 1px solid var(--grey-200);
		padding: 1em;
	}

	.panel:first-of-type {
		border-top: none;
	}

	label {
		width: 30%;
		text-transform: uppercase;
		font-weight: normal;
		font-size: 14px;
		color: var(--grey-800);
		white-space: nowrap;
	}

	div.input-item {
		font-family: var(--ui-font-family);
		color: var(--grey-999);
		font-size: 16px;
		margin-top: 1.25em;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
	}

    input {
        box-sizing: border-box;
        border-radius: 4px 4px 4px 4px;
        border: 1px solid var(--grey-300);
        padding: 0.25em 0.25em 0.25em 0.25em;
        margin-left: auto;
        width: 65%;
        padding: 0.35em;
        color: var(--grey-999);
        -webkit-appearance: none;
        -moz-appearance: none;
        vertical-align:middle;
        font-size: 16px;
    }

	.note {
		margin-top: 0.75em;
	}
</style>
