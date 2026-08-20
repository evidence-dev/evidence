import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildHeatGridSQL, type HeatGridSQLAttrs } from './build-heat-grid-sql';
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

function buildAllDialects(attrs: Omit<HeatGridSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildHeatGridSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('heat_grid SQL', () => {
	it('Basic Usage (schema example)', () => {
		const { sql } = buildAllDialects({
			data: 'appointments',
			dimension: 'province',
			value: 'avg(wait_time)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY ALL"
			----
			"SELECT province AS "PROVINCE", avg(wait_time) AS "AVG_WAIT_TIME"
			 FROM appointments
			 
			 GROUP BY ALL"
			----
			"SELECT province AS \`province\`, avg(wait_time) AS \`avg_wait_time\`
			 FROM appointments
			 
			 GROUP BY ALL"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY province"
			----
			"SELECT province AS \`province\`, avg(wait_time) AS \`avg_wait_time\`
			 FROM appointments
			 
			 GROUP BY ALL"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY province"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY province"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY ALL"
		`);
	});

	it('where clause', () => {
		const { sql } = buildAllDialects({
			data: 'appointments',
			dimension: 'province',
			value: 'avg(wait_time)',
			where: "region = 'North'"
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 WHERE (region = 'North')
			 GROUP BY ALL"
			----
			"SELECT province AS "PROVINCE", avg(wait_time) AS "AVG_WAIT_TIME"
			 FROM appointments
			 WHERE (region = 'North')
			 GROUP BY ALL"
			----
			"SELECT province AS \`province\`, avg(wait_time) AS \`avg_wait_time\`
			 FROM appointments
			 WHERE (region = 'North')
			 GROUP BY ALL"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 WHERE (region = 'North')
			 GROUP BY province"
			----
			"SELECT province AS \`province\`, avg(wait_time) AS \`avg_wait_time\`
			 FROM appointments
			 WHERE (region = 'North')
			 GROUP BY ALL"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 WHERE (region = 'North')
			 GROUP BY province"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 WHERE (region = 'North')
			 GROUP BY province"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 WHERE (region = 'North')
			 GROUP BY ALL"
		`);
	});

	it('having clause', () => {
		const { sql } = buildAllDialects({
			data: 'appointments',
			dimension: 'province',
			value: 'avg(wait_time)',
			having: 'avg(wait_time) > 60'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY ALL
			 HAVING (avg(wait_time) > 60)"
			----
			"SELECT province AS "PROVINCE", avg(wait_time) AS "AVG_WAIT_TIME"
			 FROM appointments
			 
			 GROUP BY ALL
			 HAVING (avg(wait_time) > 60)"
			----
			"SELECT province AS \`province\`, avg(wait_time) AS \`avg_wait_time\`
			 FROM appointments
			 
			 GROUP BY ALL
			 HAVING (avg(wait_time) > 60)"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY province
			 HAVING (avg(wait_time) > 60)"
			----
			"SELECT province AS \`province\`, avg(wait_time) AS \`avg_wait_time\`
			 FROM appointments
			 
			 GROUP BY ALL
			 HAVING (avg(wait_time) > 60)"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY province
			 HAVING (avg(wait_time) > 60)"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY province
			 HAVING (avg(wait_time) > 60)"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY ALL
			 HAVING (avg(wait_time) > 60)"
		`);
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'appointments',
			dimension: 'province',
			value: 'avg(wait_time)',
			date_range: { date: 'appt_date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 WHERE (appt_date >= toDate('2025-12-03') AND appt_date <= toDate('2026-01-01'))
			 GROUP BY ALL"
			----
			"SELECT province AS "PROVINCE", avg(wait_time) AS "AVG_WAIT_TIME"
			 FROM appointments
			 WHERE (appt_date >= TO_DATE('2025-12-03') AND appt_date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL"
			----
			"SELECT province AS \`province\`, avg(wait_time) AS \`avg_wait_time\`
			 FROM appointments
			 WHERE (appt_date >= DATE '2025-12-03' AND appt_date <= DATE '2026-01-01')
			 GROUP BY ALL"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 WHERE (appt_date >= CAST('2025-12-03' AS DATE) AND appt_date <= CAST('2026-01-01' AS DATE))
			 GROUP BY province"
			----
			"SELECT province AS \`province\`, avg(wait_time) AS \`avg_wait_time\`
			 FROM appointments
			 WHERE (appt_date >= DATE '2025-12-03' AND appt_date <= DATE '2026-01-01')
			 GROUP BY ALL"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 WHERE (appt_date >= DATE '2025-12-03' AND appt_date <= DATE '2026-01-01')
			 GROUP BY province"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 WHERE (appt_date >= CAST('2025-12-03' AS TIMESTAMP) AND appt_date <= CAST('2026-01-01' AS TIMESTAMP))
			 GROUP BY province"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 WHERE (appt_date >= DATE '2025-12-03' AND appt_date <= DATE '2026-01-01')
			 GROUP BY ALL"
		`);
	});

	it('order + limit', () => {
		const { sql } = buildAllDialects({
			data: 'appointments',
			dimension: 'province',
			value: 'avg(wait_time)',
			order: 'avg(wait_time) desc',
			limit: 10
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY avg(wait_time) desc LIMIT 10"
			----
			"SELECT province AS "PROVINCE", avg(wait_time) AS "AVG_WAIT_TIME"
			 FROM appointments
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY avg(wait_time) desc LIMIT 10"
			----
			"SELECT province AS \`province\`, avg(wait_time) AS \`avg_wait_time\`
			 FROM appointments
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY avg(wait_time) desc LIMIT 10"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY province
			 
			 
			 ORDER BY avg(wait_time) desc OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY"
			----
			"SELECT province AS \`province\`, avg(wait_time) AS \`avg_wait_time\`
			 FROM appointments
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY avg(wait_time) desc LIMIT 10"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY province
			 
			 
			 ORDER BY avg(wait_time) desc LIMIT 10"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY province
			 
			 
			 ORDER BY avg(wait_time) desc LIMIT 10"
			----
			"SELECT province AS "province", avg(wait_time) AS "avg_wait_time"
			 FROM appointments
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY avg(wait_time) desc LIMIT 10"
		`);
	});
});
