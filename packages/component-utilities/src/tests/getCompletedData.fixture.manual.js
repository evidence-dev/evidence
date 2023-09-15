export const MissingYCase = {
	data: [
		// take out SF 2018 and NY 2016
		{ fed_reserve_district: 'NY', established_date: '2015-01-01', banks: 1 },
		{ fed_reserve_district: 'SF', established_date: '2015-01-01', banks: 0 },
		{ fed_reserve_district: 'ATL', established_date: '2015-01-01', banks: 0 },
		{ fed_reserve_district: 'DAL', established_date: '2015-01-01', banks: 0 },
		{ fed_reserve_district: 'KC', established_date: '2015-01-01', banks: 0 },
		{ fed_reserve_district: 'CHI', established_date: '2015-01-01', banks: 0 },

		{ fed_reserve_district: 'SF', established_date: '2016-01-01', banks: 0 },
		{ fed_reserve_district: 'ATL', established_date: '2016-01-01', banks: 0 },
		{ fed_reserve_district: 'DAL', established_date: '2016-01-01', banks: 0 },
		{ fed_reserve_district: 'KC', established_date: '2016-01-01', banks: 0 },
		{ fed_reserve_district: 'CHI', established_date: '2016-01-01', banks: 0 },

		{ fed_reserve_district: 'SF', established_date: '2017-01-01', banks: 1 },
		{ fed_reserve_district: 'ATL', established_date: '2017-01-01', banks: 1 },
		{ fed_reserve_district: 'DAL', established_date: '2017-01-01', banks: 3 },
		{ fed_reserve_district: 'KC', established_date: '2017-01-01', banks: 0 },
		{ fed_reserve_district: 'CHI', established_date: '2017-01-01', banks: 0 },
		{ fed_reserve_district: 'NY', established_date: '2017-01-01', banks: 0 },

		{ fed_reserve_district: 'ATL', established_date: '2018-01-01', banks: 3 },
		{ fed_reserve_district: 'NY', established_date: '2018-01-01', banks: 1 },
		{ fed_reserve_district: 'DAL', established_date: '2018-01-01', banks: 1 },
		{ fed_reserve_district: 'CHI', established_date: '2018-01-01', banks: 0 },
		{ fed_reserve_district: 'KC', established_date: '2018-01-01', banks: 0 },

		{ fed_reserve_district: 'ATL', established_date: '2019-01-01', banks: 4 },
		{ fed_reserve_district: 'NY', established_date: '2019-01-01', banks: 4 },
		{ fed_reserve_district: 'CHI', established_date: '2019-01-01', banks: 2 },
		{ fed_reserve_district: 'SF', established_date: '2019-01-01', banks: 1 },
		{ fed_reserve_district: 'DAL', established_date: '2019-01-01', banks: 2 },
		{ fed_reserve_district: 'KC', established_date: '2019-01-01', banks: 0 },

		{ fed_reserve_district: 'NY', established_date: '2020-01-01', banks: 1 },
		{ fed_reserve_district: 'ATL', established_date: '2020-01-01', banks: 4 },
		{ fed_reserve_district: 'SF', established_date: '2020-01-01', banks: 1 },
		{ fed_reserve_district: 'KC', established_date: '2020-01-01', banks: 1 },
		{ fed_reserve_district: 'CHI', established_date: '2020-01-01', banks: 0 },
		{ fed_reserve_district: 'DAL', established_date: '2020-01-01', banks: 0 },

		{ fed_reserve_district: 'SF', established_date: '2021-01-01', banks: 2 },
		{ fed_reserve_district: 'ATL', established_date: '2021-01-01', banks: 3 },
		{ fed_reserve_district: 'CHI', established_date: '2021-01-01', banks: 3 },
		{ fed_reserve_district: 'DAL', established_date: '2021-01-01', banks: 1 },
		{ fed_reserve_district: 'KC', established_date: '2021-01-01', banks: 0 },
		{ fed_reserve_district: 'NY', established_date: '2021-01-01', banks: 0 }
	],
	keys: {
		x: 'established_date',
		y: 'banks',
		series: 'fed_reserve_district'
	},
	series: {
		SF: { interval: 0 },
		ATL: { interval: 0 },
		CHI: { interval: 0 },
		DAL: { interval: 0 },
		KC: { interval: 0 },
		NY: { interval: 0 }
	}
};
