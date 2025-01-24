<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// @ts-check

	import { Icon } from '@steeze-ui/svelte-icon';
	import { CircleX, CircleCheck, HelpCircle } from '@steeze-ui/tabler-icons';

	/** @type {{ localGitRepo?: string; gitRepo?: string }}*/
	export let settings;
</script>

<form id="version-control">
	<div class="version-control-box">
		<div class="panel">
			<h2 class="font-semibold text-lg pt-3 pb-2">Version Control</h2>
			Use version control to keep track of changes to your project. A published git repo is needed if
			you want to deploy your Evidence project online.

			<div class="git-item">
				{#if settings.localGitRepo}
					<span class="gitcheck-icon">
						<Icon src={CircleCheck} theme="filled" class="h-6 w-6  text-positive" />
					</span>
				{:else}
					<span class="gitx-icon">
						<Icon src={CircleX} theme="filled" class="h-6 w-6  text-negative" />
					</span>
				{/if}
				<span class="item-label">Local Git Repo</span>
				{#if settings.localGitRepo}
					<div class="result-msg">
						<span class="repo-location text-base-content-muted"
							>Tracking {settings.localGitRepo}</span
						>
					</div>
				{:else}
					<span class="help-icon">
						<Icon src={HelpCircle} class="h-5 w-5 pb-0.5" />
						<span class="info-msg"
							>Use your code editor to initialize a repo or run `git init` in a terminal</span
						>
					</span>
				{/if}
			</div>

			<div class="git-item">
				{#if settings.gitRepo}
					<span class="gitcheck-icon">
						<Icon src={CircleCheck} theme="filled" class="h-6 w-6 text-positive" />
					</span>
				{:else}
					<span class="gitx-icon">
						<Icon src={CircleX} theme="filled" class="h-6 w-6 text-negative" />
					</span>
				{/if}
				<span class="item-label">Git Repo Published</span>
				{#if settings.gitRepo}
					<div class="result-msg">
						<a href={settings.gitRepo.replace('.git', '')} target="_blank" rel="noreferrer"
							><span class="repo-location text-base-content-muted"
								>{settings.gitRepo.replace('.git', '')}</span
							></a
						>
					</div>
				{:else}
					<span class="help-icon">
						<Icon src={HelpCircle} class="h-5 w-5 pb-0.5" />
						<span class="info-msg">Publish your git repo to a platform like GitHub or GitLab</span>
					</span>
				{/if}
			</div>
		</div>
	</div>
	<footer>
		<span
			>Learn more about <a
				class="text-primary hover:brightness-110 active:brightness-90 transition"
				target="_blank"
				rel="noreferrer"
				href="https://docs.github.com/en/get-started/using-git/about-git"
				>Setting Up Version Control &rarr;</a
			></span
		>
	</footer>
</form>

<style>
	form {
		scroll-margin-top: 3.5rem; /* offset for sticky header */
	}

	.version-control-box {
		margin-top: 2em;
		border-top: 1px solid var(--base-300);
		border-left: 1px solid var(--base-300);
		border-right: 1px solid var(--base-300);
		border-radius: 5px 5px 0 0;
		font-size: 14px;
		font-family: var(--ui-font-family);
		min-width: 100%;
	}

	.panel {
		border-top: 1px solid var(--base-300);
		padding: 0em 1em 1em 1em;
	}

	.panel:first-of-type {
		border-top: none;
	}

	footer {
		border: 1px solid var(--base-300);
		border-radius: 0 0 5px 5px;
		background-color: var(--base-200);
		padding: 1em;
		display: flex;
		font-size: 14px;
		align-items: center;
		font-family: var(--ui-font-family);
	}

	.gitcheck-icon {
		color: var(--positive);
		float: right;
		margin-right: 5px;
	}

	.gitx-icon {
		color: var(--negative);
		float: right;
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
		font-size: 0.8rem;
		text-decoration: unset;
	}

	.item-label {
		text-transform: uppercase;
	}

	.help-icon {
		width: 18px;
		color: var(--base-300);
		display: inline-block;
		vertical-align: middle;
		line-height: 1em;
		cursor: help;
		position: relative;
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
		font-size: 0.8em;
		color: var(--base-content);
		background-color: var(--base-200);
		border-radius: 6px;
		z-index: 1;
		max-width: 200px;
		min-width: 100px;
	}

	.help-icon:hover .info-msg {
		visibility: visible;
		display: inline;
	}
</style>
