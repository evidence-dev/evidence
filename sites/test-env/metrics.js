import * as metric from '@evidence-dev/sdk/metrics';
const main = async () => {
	const metrics = await metric.loadMetrics();
	console.log({ metrics });
	console.log(metric.processMetric(metrics[0]).query);
};

main().catch(console.error);
