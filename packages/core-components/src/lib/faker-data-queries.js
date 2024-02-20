import { QueryStore } from '@evidence-dev/query-store';
import { query } from '@evidence-dev/universal-sql/client-duckdb';
export const fakerSeries = {
	airlines: {
		flights: {
			text: 'SELECT * FROM series_demo_source.flights',
			store: new QueryStore('SELECT * FROM series_demo_source.flights', query)
		}
	},
	social_media: {
		comments: {
			text: 'SELECT * FROM series_demo_source.comments',
			store: new QueryStore('SELECT * FROM series_demo_source.comments', query)
		},
		follows: {
			text: 'SELECT * FROM series_demo_source.follows',
			store: new QueryStore('SELECT * FROM series_demo_source.follows', query)
		},
		hashtags: {
			text: 'SELECT * FROM series_demo_source.hashtags',
			store: new QueryStore('SELECT * FROM series_demo_source.hashtags', query)
		},
		likes: {
			text: 'SELECT * FROM series_demo_source.likes',
			store: new QueryStore('SELECT * FROM series_demo_source.likes', query)
		},
		post_tags: {
			text: 'SELECT * FROM series_demo_source.post_tags',
			store: new QueryStore('SELECT * FROM series_demo_source.post_tags', query)
		},
		posts: {
			text: 'SELECT * FROM series_demo_source.posts',
			store: new QueryStore('SELECT * FROM series_demo_source.posts', query)
		},
		users: {
			text: 'SELECT * FROM series_demo_source.users',
			store: new QueryStore('SELECT * FROM series_demo_source.users', query)
		}
	},
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
