<script context="module">
	export const evidenceInclude = true;
</script>

<h2>Deploying to Evidence Cloud</h2>
<p>Evidence's Cloud hosting service allows you to:</p>
<ul>
	<li>Host your project at <code>{'<'}organisation{'>'}.evidence.app</code></li>
	<li>Authenticate users</li>
	<li>Schedule updates to your data</li>
	<li>Re-build when you push changes to your project</li>
</ul>
<p>Evidence Cloud is in private beta. Request early access below.</p>
<div class="new-format-buttons">
	<button
		type="button"
		on:click={() =>
			window.open(
				'https://du3tapwtcbi.typeform.com/to/kwp7ZD3q?utm_source=product&utm_campaign=deploy_panel'
			)}>Request Early Access</button
	>
</div>

<style>
	button {
		margin-right: 0.25em;
		margin-left: 0.25em;
		font-style: normal;
		text-decoration: none;
		font-size: 14px;
		cursor: pointer;
		background-color: var(--blue-600);
		color: white;
		font-weight: bold;
		border-radius: 4px;
		border: 1px solid var(--blue-700);
		padding: 0.4em 1.1em;
		transition-property: background, color;
		transition-duration: 350ms;
	}

	div.new-format-buttons {
		display: flex;
		justify-content: flex-start;
		padding-top: 0.5em;
	}

	ul {
		list-style: none;
		padding-inline-start: 0px;
	}

	ul li::before {
		content: '\2022';
		color: var(--grey-800);
		font-weight: bold;
		display: inline-block;
		width: 0.9em;
		margin-left: 1.5em;
	}
</style>
