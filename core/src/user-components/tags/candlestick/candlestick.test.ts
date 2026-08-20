import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildCandlestickSQL, type CandlestickSQLAttrs } from './build-candlestick-sql';
import {
	SnowflakeDialect,
	ClickHouseDialect,
	BigQueryDialect,
	FabricDialect,
	DatabricksDialect,
	PostgresDialect,
	CubeDialect,
	MotherDuckDialect
} from '../../../sql-dialect';

const dialects = [
	new ClickHouseDialect(),
	new SnowflakeDialect(),
	new BigQueryDialect(),
	new FabricDialect(),
	new DatabricksDialect(),
	new PostgresDialect(),
	new CubeDialect(),
	new MotherDuckDialect()
];

function buildAllDialects(attrs: Omit<CandlestickSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildCandlestickSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('candlestick SQL', () => {
	it('Basic Usage (OHLC, no volume, no date_grain)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.prices',
			x: 'date',
			open: 'open',
			high: 'high',
			low: 'low',
			close: 'close'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "DATE", open AS "OPEN", high AS "HIGH", low AS "LOW", close AS "CLOSE"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE"
			----
			"SELECT date AS \`date\`, open AS \`open\`, high AS \`high\`, low AS \`low\`, close AS \`close\`
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY date, open, high, low, close
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS \`date\`, open AS \`open\`, high AS \`high\`, low AS \`low\`, close AS \`close\`
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY date, open, high, low, close
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY date, open, high, low, close
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
		`);
	});

	it('with volume column', () => {
		const { sql } = buildAllDialects({
			data: 'demo.prices',
			x: 'date',
			open: 'open',
			high: 'high',
			low: 'low',
			close: 'close',
			volume: 'volume'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close", volume AS "volume"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "DATE", open AS "OPEN", high AS "HIGH", low AS "LOW", close AS "CLOSE", volume AS "VOLUME"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE"
			----
			"SELECT date AS \`date\`, open AS \`open\`, high AS \`high\`, low AS \`low\`, close AS \`close\`, volume AS \`volume\`
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close", volume AS "volume"
			 FROM demo.prices
			 
			 GROUP BY date, open, high, low, close, volume
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS \`date\`, open AS \`open\`, high AS \`high\`, low AS \`low\`, close AS \`close\`, volume AS \`volume\`
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close", volume AS "volume"
			 FROM demo.prices
			 
			 GROUP BY date, open, high, low, close, volume
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close", volume AS "volume"
			 FROM demo.prices
			 
			 GROUP BY date, open, high, low, close, volume
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close", volume AS "volume"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
		`);
	});

	it('date_grain=month emits ClickHouse toStartOfMonth on x', () => {
		const { sql } = buildAllDialects({
			data: 'demo.prices',
			x: 'date',
			open: 'open',
			high: 'high',
			low: 'low',
			close: 'close',
			date_grain: 'month'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfMonth(date) AS "date__month", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS "DATE__MONTH", open AS "OPEN", high AS "HIGH", low AS "LOW", close AS "CLOSE"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__MONTH"
			----
			"SELECT DATE_TRUNC(date, MONTH) AS \`date__month\`, open AS \`open\`, high AS \`high\`, low AS \`low\`, close AS \`close\`
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATETRUNC(month, date) AS "date__month", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY DATETRUNC(month, date), open, high, low, close
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS \`date__month\`, open AS \`open\`, high AS \`high\`, low AS \`low\`, close AS \`close\`
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY DATE_TRUNC('month', date), open, high, low, close
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY DATE_TRUNC('month', date), open, high, low, close
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
		`);
	});

	it('date_grain=week honors firstDayOfWeek=monday (toStartOfWeek mode)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.prices',
			x: 'date',
			open: 'open',
			high: 'high',
			low: 'low',
			close: 'close',
			date_grain: 'week',
			firstDayOfWeek: 'monday'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfWeek(date, 5) AS "date__week", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__week"
			----
			"SELECT DATE_TRUNC('WEEK', date) AS "DATE__WEEK", open AS "OPEN", high AS "HIGH", low AS "LOW", close AS "CLOSE"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__WEEK"
			----
			"SELECT DATE_TRUNC(date, ISOWEEK) AS \`date__week\`, open AS \`open\`, high AS \`high\`, low AS \`low\`, close AS \`close\`
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__week"
			----
			"SELECT DATETRUNC(week, date) AS "date__week", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY DATETRUNC(week, date), open, high, low, close
			 
			 
			 ORDER BY date__week"
			----
			"SELECT DATE_TRUNC('WEEK', date) AS \`date__week\`, open AS \`open\`, high AS \`high\`, low AS \`low\`, close AS \`close\`
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__week"
			----
			"SELECT DATE_TRUNC('week', date) AS "date__week", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY DATE_TRUNC('week', date), open, high, low, close
			 
			 
			 ORDER BY date__week"
			----
			"SELECT DATE_TRUNC('week', date) AS "date__week", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY DATE_TRUNC('week', date), open, high, low, close
			 
			 
			 ORDER BY date__week"
			----
			"SELECT DATE_TRUNC('week', date) AS "date__week", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__week"
		`);
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'demo.prices',
			x: 'date',
			open: 'open',
			high: 'high',
			low: 'low',
			close: 'close',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "DATE", open AS "OPEN", high AS "HIGH", low AS "LOW", close AS "CLOSE"
			 FROM demo.prices
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE"
			----
			"SELECT date AS \`date\`, open AS \`open\`, high AS \`high\`, low AS \`low\`, close AS \`close\`
			 FROM demo.prices
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY date, open, high, low, close
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS \`date\`, open AS \`open\`, high AS \`high\`, low AS \`low\`, close AS \`close\`
			 FROM demo.prices
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY date, open, high, low, close
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 WHERE (date >= CAST('2025-12-03' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP))
			 GROUP BY date, open, high, low, close
			 
			 
			 ORDER BY date"
			----
			"SELECT date AS "date", open AS "open", high AS "high", low AS "low", close AS "close"
			 FROM demo.prices
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY date"
		`);
	});
});
