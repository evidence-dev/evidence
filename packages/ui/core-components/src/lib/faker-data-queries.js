import { Query } from '@evidence-dev/sdk/usql';
import { query } from '@evidence-dev/universal-sql/client-duckdb';
export const fakerSeries = {
	airlines: {
		flights: {
			text: 'SELECT * FROM series_demo_source.flights',
			store: Query.create('SELECT * FROM series_demo_source.flights', query, { disableCache: true })
		}
	},
	social_media: {
		comments: {
			text: 'SELECT * FROM series_demo_source.comments',
			store: Query.create('SELECT * FROM series_demo_source.comments', query, {
				disableCache: true
			})
		},
		follows: {
			text: 'SELECT * FROM series_demo_source.follows',
			store: Query.create('SELECT * FROM series_demo_source.follows', query, { disableCache: true })
		},
		hashtags: {
			text: 'SELECT * FROM series_demo_source.hashtags',
			store: Query.create('SELECT * FROM series_demo_source.hashtags', query, {
				disableCache: true
			})
		},
		likes: {
			text: 'SELECT * FROM series_demo_source.likes',
			store: Query.create('SELECT * FROM series_demo_source.likes', query, { disableCache: true })
		},
		post_tags: {
			text: 'SELECT * FROM series_demo_source.post_tags',
			store: Query.create('SELECT * FROM series_demo_source.post_tags', query, {
				disableCache: true
			})
		},
		posts: {
			text: 'SELECT * FROM series_demo_source.posts',
			store: Query.create('SELECT * FROM series_demo_source.posts', query, { disableCache: true })
		},
		users: {
			text: 'SELECT * FROM series_demo_source.users',
			store: Query.create('SELECT * FROM series_demo_source.users', query, { disableCache: true })
		}
	},
	numeric_series: {
		false: {
			false: {
				false: {
					text: 'SELECT * FROM series_demo_source.numeric_series_seriesgaps',
					store: Query.create('SELECT * FROM series_demo_source.numeric_series_seriesgaps', query, {
						disableCache: true
					})
				},
				true: {
					text: 'SELECT * FROM series_demo_source.numeric_series',
					store: Query.create('SELECT * FROM series_demo_source.numeric_series', query, {
						disableCache: true
					})
				}
			},
			true: {
				false: {
					text: 'SELECT * FROM series_demo_source.numeric_series_ynulls_seriesgaps',
					store: Query.create(
						'SELECT * FROM series_demo_source.numeric_series_ynulls_seriesgaps',
						query
					)
				},
				true: {
					text: 'SELECT * FROM series_demo_source.numeric_series_ynulls',
					store: Query.create('SELECT * FROM series_demo_source.numeric_series_ynulls', query, {
						disableCache: true
					})
				}
			}
		},
		true: {
			false: {
				false: {
					text: 'SELECT * FROM series_demo_source.numeric_series_xgaps_seriesgaps',
					store: Query.create(
						'SELECT * FROM series_demo_source.numeric_series_xgaps_seriesgaps',
						query
					)
				},
				true: {
					text: 'SELECT * FROM series_demo_source.numeric_series_xgaps',
					store: Query.create('SELECT * FROM series_demo_source.numeric_series_xgaps', query, {
						disableCache: true
					})
				}
			},
			true: {
				false: {
					text: 'SELECT * FROM series_demo_source.numeric_series_xgaps_ynulls_seriesgaps',
					store: Query.create(
						'SELECT * FROM series_demo_source.numeric_series_xgaps_ynulls_seriesgaps',
						query
					)
				},
				true: {
					text: 'SELECT * FROM series_demo_source.numeric_series_xgaps_ynulls',
					store: Query.create(
						'SELECT * FROM series_demo_source.numeric_series_xgaps_ynulls',
						query,
						{ disableCache: true }
					)
				}
			}
		}
	}
};
