<script>
	import { browser } from '$app/environment';

	import { AdHocReport } from '@evidence-dev/core-components';

	let readonly = false;
	if (browser) {
		readonly =
			new URLSearchParams(window.location.search).get('readonly')?.toLowerCase() === 'true';
	}

	let source =
		browser && new URLSearchParams(window.location.search).has('report') ? 'url' : 'localStorage';
</script>

<AdHocReport persistToLocalStorage persistToUrl {readonly} initialState={source} />
