import mockfs from 'mock-fs';

export const filesystem = {
	partials: {
		'basic.md': 'partial'
	}
};

mockfs(filesystem);
