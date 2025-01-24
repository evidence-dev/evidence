<h2 class="font-semibold text-lg pt-3 pb-2">Deploying to Evidence Cloud</h2>
<p class="text-sm py-2">Evidence Cloud allows you to:</p>
<ul>
	<li>Host your project at <code>{'<'}project-name{'>'}.evidence.app</code></li>
	<li>Authenticate users</li>
	<li>Schedule updates to your data</li>
	<li>Re-build when you push changes to your project</li>
</ul>

<div class="new-format-buttons my-3">
	<button type="button">
		<a
			class="no-underline hover:no-underline"
			target="_blank"
			rel="noreferrer"
			href="https://evidence.app">Sign Up</a
		>
	</button>
</div>

<style>
	button {
		margin-right: 0.25em;
		margin-left: 0.25em;
		font-style: normal;
		text-decoration: none;
		font-size: 14px;
		cursor: pointer;
		background-color: var(--primary);
		color: var(--primary-content);
		font-weight: bold;
		border-radius: 4px;
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
		color: var(--base-content);
		font-weight: bold;
		display: inline-block;
		width: 0.9em;
		margin-left: 1.5em;
	}
</style>
