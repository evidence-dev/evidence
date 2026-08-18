import { afterEach, describe, expect, test } from 'vitest';
import { init, type ECharts } from 'echarts';
import { applyConnectGroup } from './echarts.action';

// echarts uses each instance's `.group` to decide action fanout — assert that real
// contract on headless instances, not that a mock was called.
describe('applyConnectGroup', () => {
	const charts: ECharts[] = [];
	const makeChart = (): ECharts => {
		const chart = init(null, null, { renderer: 'svg', ssr: true, width: 300, height: 200 });
		charts.push(chart);
		return chart;
	};

	afterEach(() => {
		charts.splice(0).forEach((c) => c.dispose());
	});

	test('charts sharing an id land in the same group; a different id does not', () => {
		const a = makeChart();
		const b = makeChart();
		const c = makeChart();

		applyConnectGroup(a, 'prices');
		applyConnectGroup(b, 'prices');
		applyConnectGroup(c, 'volume');

		expect(a.group).toBe('prices');
		expect(b.group).toBe('prices');
		expect(c.group).toBe('volume');
	});

	test('clearing the group (undefined) removes the chart from any group', () => {
		const a = makeChart();
		applyConnectGroup(a, 'prices');
		expect(a.group).toBe('prices');

		applyConnectGroup(a, undefined);
		expect(a.group).toBe('');
	});

	test('changing the id moves the chart to the new group', () => {
		const a = makeChart();
		applyConnectGroup(a, 'prices');
		applyConnectGroup(a, 'volume');
		expect(a.group).toBe('volume');
	});

	test('no group leaves the chart ungrouped and does not throw', () => {
		const a = makeChart();
		expect(() => applyConnectGroup(a, undefined)).not.toThrow();
		expect(a.group).toBe('');
	});
});

// Assert the real synced-interaction effect: a co-grouped chart receives a dispatched
// action, an ungrouped one doesn't, and clearing the group stops it.
describe('applyConnectGroup — synced interaction fanout', () => {
	const charts: ECharts[] = [];
	const makeChart = (): ECharts => {
		const chart = init(null, null, { renderer: 'svg', ssr: true, width: 300, height: 200 });
		chart.setOption({
			xAxis: { type: 'category', data: ['a', 'b', 'c'] },
			yAxis: { type: 'value' },
			series: [{ type: 'line', data: [1, 2, 3] }]
		});
		charts.push(chart);
		return chart;
	};

	afterEach(() => {
		charts.splice(0).forEach((c) => c.dispose());
	});

	test('an action on one chart fans out to a co-grouped chart but not to others', () => {
		const source = makeChart();
		const sameGroup = makeChart();
		const otherGroup = makeChart();
		let sameReceived = false;
		let otherReceived = false;
		sameGroup.on('highlight', () => (sameReceived = true));
		otherGroup.on('highlight', () => (otherReceived = true));

		applyConnectGroup(source, 'prices');
		applyConnectGroup(sameGroup, 'prices');
		applyConnectGroup(otherGroup, 'volume');

		source.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: 1 });

		expect(sameReceived).toBe(true);
		expect(otherReceived).toBe(false);
	});

	test('clearing the group stops a chart from receiving fanned-out actions', () => {
		const source = makeChart();
		const target = makeChart();
		let received = false;
		target.on('highlight', () => (received = true));

		applyConnectGroup(source, 'prices');
		applyConnectGroup(target, 'prices');
		applyConnectGroup(target, undefined);

		source.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: 1 });

		expect(received).toBe(false);
	});
});
