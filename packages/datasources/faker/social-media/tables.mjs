export const follows = {
	rows: 1500,
	schema: {
		id: { type: 'id' },
		follower_id: { type: 'fk', withBias: true, target: { table: 'users.yaml' } },
		following_id: { type: 'fk', withBias: true, target: { table: 'users.yaml' } }
	},
	filters: [
		{ type: 'ne', fields: ['follower_id', 'following_id'] },
		{ type: 'unique', fields: ['follower_id', 'following_id'] }
	]
};
export const users = {
	rows: 1000,
	schema: {
		id: { type: 'id' },
		user_name: { category: 'internet', item: 'userName' },
		full_name: { category: 'person', item: 'fullName' },
		email: { category: 'internet', item: 'email' },
		created_at: { category: 'date', item: 'recent', options: [{ days: 365 }] },
		gender: {
			category: 'helpers',
			item: 'arrayElement',
			withBias: true,
			options: ['Male', 'Male', 'Male', 'Female', 'Female', 'Female', 'Other']
		}
	}
};
export const comments = {
	rows: 5000,
	schema: {
		id: { type: 'id' },
		user_id: { type: 'fk', target: { table: 'users.yaml' } },
		post_id: { type: 'fk', target: { table: './posts.yaml' } },
		content: { category: 'lorem', item: 'sentence' },
		created_at: { category: 'date', item: 'recent' }
	}
};
export const posts = {
	rows: 2500,
	schema: {
		id: { type: 'id' },
		user_id: { type: 'fk', withBias: true, target: { table: 'users.yaml' } },
		content: { category: 'lorem', item: 'paragraph' },
		created_at: { category: 'date', item: 'recent', withBias: true, options: [{ days: 365 }] }
	}
};
export const post_tags = {
	rows: 2000,
	schema: {
		id: { type: 'id' },
		post_id: { type: 'fk', withBias: true, target: { table: './posts.yaml' } },
		hashtag_id: { type: 'fk', withBias: true, target: { table: './hashtags.yaml' } }
	},
	filters: [{ type: 'unique', fields: ['post_id', 'hashtag_id'] }]
};

export const likes = {
	rows: 6000,
	schema: {
		id: { type: 'id' },
		user_id: { type: 'fk', withBias: true, target: { table: 'users.yaml' } },
		post_id: { type: 'fk', withBias: true, target: { table: './posts.yaml' } }
	},
	filters: [{ type: 'unique', fields: ['user_id', 'post_id'] }]
};
export const hashtags = {
	rows: 10,
	schema: {
		id: { type: 'id' },
		tag: {
			oneof: [
				{ category: 'helpers', item: 'fake', options: ['#{{company.buzzAdjective}}'] },
				{ category: 'helpers', item: 'fake', options: ['#{{company.buzzNoun}}'] },
				{ category: 'helpers', item: 'fake', options: ['#{{company.catchPhraseAdjective}}'] },
				{ category: 'helpers', item: 'fake', options: ['#{{company.catchPhraseNoun}}'] },
				{
					category: 'helpers',
					item: 'fake',
					options: ['#{{person.jobDescriptor}}{{company.catchPhraseNoun}}']
				},
				{ category: 'helpers', item: 'fake', options: ['#{{hacker.ingverb}}{{hacker.noun}}'] }
			]
		}
	},
	filters: [{ type: 'unique', fields: ['tag'] }]
};
