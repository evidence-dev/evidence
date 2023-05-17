import { getPluginComponents } from '@evidence-dev/plugin-connector';
getPluginComponents()
	.catch(console.error)
	.then((result) => {
		console.log(result);
	});
