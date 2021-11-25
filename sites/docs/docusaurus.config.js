/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
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
        src: 'img/evidence.svg',
      },
      items: [
        // {
        //   to: 'https://evidence.dev',
        //   position: 'left',
        //   label: 'Home',
        //   target: '_self',
        // },
        {
          type: 'doc',
          docId: 'introduction/intro',
          // to: '/',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/community',
          position: 'left',
          label: 'Community',
        },
        {
          href: 'https://github.com/evidence-dev/evidence',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/',
            },
            {
              label: 'Get Started',
              to: '/getting-started/get-started',
            },
            {
              label: 'Tutorial',
              to: '/tutorial/what-well-build',
            },
            {
              label: 'Templating',
              to: '/templating/loops',
            },
            {
              label: 'Components',
              to: '/components/text-components/value',
            },
            {
              label: 'Formatting',
              to: '/formatting/format-tags',
            },
            {
              label: 'Deployment',
              to: '/deployment/deployment-overview',
            },
            {
              label: 'Walkthroughs',
              to: '/walkthroughs/installation',
            },
            {
              label: 'Troubleshooting',
              to: '/troubleshooting',
            },
            {
              label: 'Usage Statistics',
              to: '/usage-statistics',
            },
            // {
            //   label: 'Community',
            //   to: '/community',
            // },
          ],
        },
        {
          title: 'Evidence',
          items: [
            {
              label: 'Home',
              href: 'https://evidence.dev',
              target: '_self',
            },
            {
              label: 'Examples',
              href: 'https://evidence.dev/examples',
              target: '_self',
            },
            {
              label: 'Blog',
              href: 'https://evidence.dev/blog',
              target: '_self',
            },

          ],
        },
               {
          title: 'Community',
          items: [
            {
              label: 'Slack',
              href: 'https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/evidence_dev',
            },
            // {
            //   label: 'Stack Overflow',
            //   href: 'https://stackoverflow.com/questions/tagged/evidence',
            // },
            {
              label: 'GitHub',
              href: 'https://github.com/evidence-dev/evidence',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Evidence Technologies, Inc.`,
    },
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
          routeBasePath: '/'
        },
        // blog: {
        //   showReadingTime: true,
        //   // Please change this to your repo.
        //   editUrl:
        //     'https://github.com/facebook/docusaurus/edit/master/website/blog/',
        // },
        theme: {
          customCss: require.resolve('./src/css/custom.css'), 
        },
      },
    ],
  ],
  scripts: [
    'https://scripts.simpleanalyticscdn.com/latest.js'
  ],
};
