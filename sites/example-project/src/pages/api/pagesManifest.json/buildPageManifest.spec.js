import { _buildPageManifest } from './+server';
import { describe, it, expect } from 'vitest';

describe('_buildPageManifest', () => {
	it('should return the correct page manifest for a single page', () => {
		const pages = {
			'/src/pages/+page.md': '---\ntitle: Home\n---\n\nThis is the home page.'
		};

		const expectedManifest = {
			label: 'Home',
			href: '/',
			children: {},
			frontMatter: { title: 'Home' },
			isTemplated: false,
			isPage: true
		};

		const manifest = _buildPageManifest(pages);

		expect(manifest).toEqual(expectedManifest);
	});

	it('should return the correct page manifest for multiple pages with a single child', () => {
		const pages = {
			'/src/pages/+page.md': '---\ntitle: Home\n---\n\nThis is the home page.',
			'/src/pages/about/+page.md': '---\ntitle: About\n---\n\nThis is the about page.'
		};

		const expectedManifest = {
			label: 'Home',
			href: '/',
			children: {
				about: {
					label: 'about',
					href: '/about',
					children: {},
					frontMatter: { title: 'About' },
					isTemplated: false,
					isPage: true
				}
			},
			frontMatter: { title: 'Home' },
			isTemplated: false,
			isPage: true
		};

		const manifest = _buildPageManifest(pages);

		expect(manifest).toEqual(expectedManifest);
	});

	it('should return the correct page manifest for multiple pages', () => {
		const pages = {
			'/src/pages/+page.md': '---\ntitle: Home\n---\n\nThis is the home page.',
			'/src/pages/about/+page.md': '---\ntitle: About\n---\n\nThis is the about page.',
			'/src/pages/contact/+page.md': '---\ntitle: Contact\n---\n\nThis is the contact page.'
		};

		const expectedManifest = {
			label: 'Home',
			href: '/',
			children: {
				about: {
					label: 'about',
					href: '/about',
					children: {},
					frontMatter: { title: 'About' },
					isTemplated: false,
					isPage: true
				},
				contact: {
					label: 'contact',
					href: '/contact',
					children: {},
					frontMatter: { title: 'Contact' },
					isTemplated: false,
					isPage: true
				}
			},
			frontMatter: { title: 'Home' },
			isTemplated: false,
			isPage: true
		};

		const manifest = _buildPageManifest(pages);

		expect(manifest).toEqual(expectedManifest);
	});

	it('should return the correct page manifest for templated pages', () => {
		const pages = {
			'/src/pages/[slug]/+page.md':
				'---\nbreadcrumb: "SELECT title as breadcrumb FROM table WHERE id = {params.id}"\n---\n\nThis is the [slug] page.'
		};

		const expectedManifest = {
			label: 'Home',
			href: undefined,
			children: {
				'[slug]': {
					label: undefined,
					href: undefined,
					children: {},
					frontMatter: {
						breadcrumb: 'SELECT title as breadcrumb FROM table WHERE id = {params.id}'
					},
					isTemplated: true,
					isPage: true
				}
			},
			frontMatter: {},
			isTemplated: false,
			isPage: false
		};

		const manifest = _buildPageManifest(pages);

		expect(manifest).toEqual(expectedManifest);
	});

	it('should return the correct page manifest for templated pages with children', () => {
		const pages = {
			'/src/pages/[slug]/+page.md':
				'---\nbreadcrumb: "SELECT title as breadcrumb FROM table WHERE id = {params.id}"\n---\n\nThis is the [slug] page.',
			'/src/pages/[slug]/child/+page.md': '---\ntitle: Child\n---\n\nThis is the child page.'
		};

		const expectedManifest = {
			label: 'Home',
			href: undefined,
			children: {
				'[slug]': {
					label: undefined,
					href: undefined,
					children: {
						child: {
							label: 'child',
							href: undefined,
							children: {},
							frontMatter: { title: 'Child' },
							isTemplated: false,
							isPage: true
						}
					},
					frontMatter: {
						breadcrumb: 'SELECT title as breadcrumb FROM table WHERE id = {params.id}'
					},
					isTemplated: true,
					isPage: true
				}
			},
			frontMatter: {},
			isTemplated: false,
			isPage: false
		};

		const manifest = _buildPageManifest(pages);

		expect(manifest).toEqual(expectedManifest);
	});

	it('should return the correct page manifest for templated pages with multiple children', () => {
		const pages = {
			'/src/pages/[slug]/+page.md':
				'---\nbreadcrumb: "SELECT title as breadcrumb FROM table WHERE id = {params.id}"\n---\n\nThis is the [slug] page.',
			'/src/pages/[slug]/child/+page.md': '---\ntitle: Child\n---\n\nThis is the child page.',
			'/src/pages/[slug]/grandchild/+page.md':
				'---\ntitle: Grandchild\n---\n\nThis is the grandchild page.'
		};

		const expectedManifest = {
			label: 'Home',
			href: undefined,
			children: {
				'[slug]': {
					label: undefined,
					href: undefined,
					children: {
						child: {
							label: 'child',
							href: undefined,
							children: {},
							frontMatter: { title: 'Child' },
							isTemplated: false,
							isPage: true
						},
						grandchild: {
							label: 'grandchild',
							href: undefined,
							children: {},
							frontMatter: { title: 'Grandchild' },
							isTemplated: false,
							isPage: true
						}
					},
					frontMatter: {
						breadcrumb: 'SELECT title as breadcrumb FROM table WHERE id = {params.id}'
					},
					isTemplated: true,
					isPage: true
				}
			},
			frontMatter: {},
			isTemplated: false,
			isPage: false
		};

		const manifest = _buildPageManifest(pages);

		expect(manifest).toEqual(expectedManifest);
	});

	it('should return the correct page manifest for templated pages with multiple children and nested templated pages', () => {
		const pages = {
			'/src/pages/[slug]/+page.md':
				'---\nbreadcrumb: "SELECT title as breadcrumb FROM table WHERE id = {params.id}"\n---\n\nThis is the [slug] page.',
			'/src/pages/[slug]/child/+page.md': '---\ntitle: Child\n---\n\nThis is the child page.',
			'/src/pages/[slug]/[id]/+page.md': '---\ntitle: ID\n---\n\nThis is the [id] page.',
			'/src/pages/[slug]/[id]/grandchild/+page.md':
				'---\ntitle: Grandchild\n---\n\nThis is the grandchild page.'
		};

		const expectedManifest = {
			label: 'Home',
			href: undefined,
			children: {
				'[slug]': {
					label: undefined,
					href: undefined,
					children: {
						child: {
							label: 'child',
							href: undefined,
							children: {},
							frontMatter: { title: 'Child' },
							isTemplated: false,
							isPage: true
						},
						'[id]': {
							label: undefined,
							href: undefined,
							children: {
								grandchild: {
									label: 'grandchild',
									href: undefined,
									children: {},
									frontMatter: { title: 'Grandchild' },
									isTemplated: false,
									isPage: true
								}
							},
							frontMatter: { title: 'ID' },
							isTemplated: true,
							isPage: true
						}
					},
					frontMatter: {
						breadcrumb: 'SELECT title as breadcrumb FROM table WHERE id = {params.id}'
					},
					isTemplated: true,
					isPage: true
				}
			},
			frontMatter: {},
			isTemplated: false,
			isPage: false
		};

		const manifest = _buildPageManifest(pages);

		expect(manifest).toEqual(expectedManifest);
	});
});
