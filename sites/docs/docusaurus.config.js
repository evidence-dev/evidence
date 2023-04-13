/** @type {import('@docusaurus/types').DocusaurusConfig} */
// Add Math Eqn Support
const math = require('remark-math');
const katex = require('rehype-katex');

const config = {
	title: 'Evidence Docs',
	tagline: 'Get Started with Evidence',
	url: 'https://docs.evidence.dev',
	baseUrl: '/',
	onBrokenLinks: 'throw',
	onBrokenMarkdownLinks: 'warn',
	favicon: 'img/favicon.ico',
	organizationName: 'evidence', // Usually your GitHub org/user name.
	projectName: 'evidence', // Usually your repo name.
	themeConfig: {
		navbar: {
			// title: 'evidence',
			logo: {
				alt: 'Evidence',
				src: 'img/evidence.svg'
			},
			items: [
				{
					// type: 'doc',
					// docId: 'getting-started/install-evidence',
					to: '/',
					position: 'right',
					label: 'Docs'
				},
				{
					to: '/community',
					position: 'right',
					label: 'Community'
				},
				{
					href: 'https://github.com/evidence-dev/evidence',
					//label: 'Github',
					position: 'right',
					className: 'header-github-link',
					'aria-label': 'GitHub repository'
				}
			]
		},
		algolia: {
			// The application ID provided by Algolia
			appId: 'KHH9ANIISC',

			// Public API key: it is safe to commit it
			apiKey: 'd2bd44615d8d5f5464e54f06e82edd19',

			indexName: 'docs-evidence'
		},
		footer: {
			style: 'dark',
			links: [
				{
					title: 'Docs',
					items: [
						{
							label: 'What is Evidence?',
							to: '/'
						},
						{
							label: 'Get Started',
							to: '/getting-started/install-evidence'
						},
						{
							label: 'Core Concepts',
							to: '/core-concepts/syntax'
						},
						{
							label: 'Deployment',
							to: '/deployment/overview'
						},
						{
							label: 'Component Reference',
							to: '/components/all-components'
						},
						{
							label: 'Markdown Reference',
							to: '/markdown'
						},
						{
							label: 'Themes and Layouts',
							to: '/themes-and-layouts'
						},
						{
							label: 'Guides',
							to: '/guides/troubleshooting'
						}
					]
				},
				{
					title: 'Evidence',
					items: [
						{
							label: 'Home',
							href: 'https://evidence.dev'
						},
						{
							label: 'Examples',
							href: 'https://evidence.dev/examples'
						},
						{
							label: 'Blog',
							href: 'https://evidence.dev/blog'
						}
					]
				},
				{
					title: 'Community',
					items: [
						{
							label: 'Slack',
							href: 'https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q'
						},
						{
							label: 'Twitter',
							href: 'https://twitter.com/evidence_dev'
						},
						// {
						//   label: 'Stack Overflow',
						//   href: 'https://stackoverflow.com/questions/tagged/evidence',
						// },
						{
							label: 'GitHub',
							href: 'https://github.com/evidence-dev/evidence'
						}
					]
				}
			],
			copyright: `Copyright © ${new Date().getFullYear()} Evidence Technologies, Inc.`
		},
		prism: {
			darkTheme: require('prism-react-renderer/themes/palenight'),
			additionalLanguages: ['sql']
		}
	},
	presets: [
		[
			'@docusaurus/preset-classic',
			{
				docs: {
					sidebarPath: require.resolve('./sidebars.js'),
					// Please change this to your repo.
					// editUrl:
					//   'https://github.com/facebook/docusaurus/edit/master/website/',
					routeBasePath: '/',
					// Add Math Eqn Support
					remarkPlugins: [math],
					rehypePlugins: [katex]
				},
				// blog: {
				//   showReadingTime: true,
				//   // Please change this to your repo.
				//   editUrl:
				//     'https://github.com/facebook/docusaurus/edit/master/website/blog/',
				// },
				theme: {
					customCss: require.resolve('./src/css/custom.css')
				}
			}
		]
	],
	scripts: [
		'https://scripts.simpleanalyticscdn.com/latest.js',
		'https://scripts.simpleanalyticscdn.com/auto-events.js'
	],
	// Add math stylesheets
	stylesheets: [
		{
			href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
			type: 'text/css',
			integrity: 'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
			crossorigin: 'anonymous'
		}
	]
};

async function createConfig() {
	const lightTheme = (await import('./src/utils/prismLight.mjs')).default;
	config.themeConfig.prism.theme = lightTheme;

	return config;
}

module.exports = createConfig();
