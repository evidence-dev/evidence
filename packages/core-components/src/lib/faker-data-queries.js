import { QueryStore } from '@evidence-dev/query-store';
import { query } from '@evidence-dev/universal-sql/client-duckdb';
export const fakerSeries = {
	numeric_series: {
		false: {
			false: {
				false: {
					text: 'SELECT * FROM series_demo_source.numeric_series_seriesgaps',
					store: new QueryStore('SELECT * FROM series_demo_source.numeric_series_seriesgaps', query)
				},
				true: {
					text: 'SELECT * FROM series_demo_source.numeric_series',
					store: new QueryStore('SELECT * FROM series_demo_source.numeric_series', query)
				}
			},
			true: {
				false: {
					text: 'SELECT * FROM series_demo_source.numeric_series_ynulls_seriesgaps',
					store: new QueryStore(
						'SELECT * FROM series_demo_source.numeric_series_ynulls_seriesgaps',
						query
					)
				},
				true: {
					text: 'SELECT * FROM series_demo_source.numeric_series_ynulls',
					store: new QueryStore('SELECT * FROM series_demo_source.numeric_series_ynulls', query)
				}
			}
		},
		true: {
			false: {
				false: {
					text: 'SELECT * FROM series_demo_source.numeric_series_xgaps_seriesgaps',
					store: new QueryStore(
						'SELECT * FROM series_demo_source.numeric_series_xgaps_seriesgaps',
						query
					)
				},
				true: {
					text: 'SELECT * FROM series_demo_source.numeric_series_xgaps',
					store: new QueryStore('SELECT * FROM series_demo_source.numeric_series_xgaps', query)
				}
			},
			true: {
				false: {
					text: 'SELECT * FROM series_demo_source.numeric_series_xgaps_ynulls_seriesgaps',
					store: new QueryStore(
						'SELECT * FROM series_demo_source.numeric_series_xgaps_ynulls_seriesgaps',
						query
					)
				},
				true: {
					text: 'SELECT * FROM series_demo_source.numeric_series_xgaps_ynulls',
					store: new QueryStore(
						'SELECT * FROM series_demo_source.numeric_series_xgaps_ynulls',
						query
					)
				}
			}
		}
	}
};
