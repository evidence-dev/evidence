<script>
	import { addMapMiddleware } from '@evidence-dev/sdk/utils';
	/** @type {'map'} */
	export let middlewareType = 'map';

	/** @type {CallableFunction} */
	export let middleware; // Empty

	const emptyFn = () => {};
	switch (middlewareType) {
		case 'map':
			addMapMiddleware(middleware ?? emptyFn);
			break;
	}
</script>
