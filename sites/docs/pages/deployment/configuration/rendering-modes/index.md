---
sidebar_position: 5
hide_table_of_contents: false
title: Rendering Modes
description: Evidence supports rendering using Static Site Generation (Default) or Single Page App (SPA) mode.
---

Evidence supports two rendering modes:

1. Static Site Generation (Default)
2. Single Page App (SPA)


```sql rendering_modes
select 'Content Rendering' as rendering_mode, 'Pre-rendered at build time' as static_site_generation, 'Rendered on the client side' as single_page_app, 1 as row_number union all
select 'Page Generation', 'Each page generated ahead of time', 'Only one HTML file generated', 2 union all
select 'Built Output', 'All pages have corresponding HTML files', 'Pages rendered on the fly using JavaScript', 3 union all
select 'Build Duration', 'Slower due to building all pages', 'Fast as only one page is built', 4 union all
select 'Performance', 'Fast page loads', 'Slower page loads', 5 union all
select 'SEO', 'Rich SEO for all pages', 'Generic SEO for your whole app', 6
order by row_number
```

## Choosing a Rendering Mode

You should generally only use the SPA rendering mode if one of the following is true:
- **You have a large number of pages**, >1000+ is a good rule of thumb
- **You want to update your data frequently**, so short build times are desirable
- **Your data sources are large**

## Comparison

<DataTable data={rendering_modes} wrapTitles>
    <Column id=rendering_mode />
    <Column id=static_site_generation wrap/>
    <Column id=single_page_app wrap/>
</DataTable>

## Enabling SPA Mode

SPA rendering mode is disabled by default.

To enable SPA rendering mode:

1. Update the build and preview scripts in `package.json`:

```json
"build": "VITE_EVIDENCE_SPA=true evidence build",
"preview": "VITE_EVIDENCE_SPA=true evidence preview",
```

2. Add svelte adapter-static as a dev dependency:

```bash
npm install --save-dev @sveltejs/adapter-static
```

3. Add a `svelte.config.js` file to the root of your project containing the following:

```javascript
import adapter from '@sveltejs/adapter-static';

/** @type {import("@sveltejs/kit").Config} */
export default {
    kit: {
        adapter: adapter({
            fallback: 'index.html'
        })
    },
};
```

4. If self-hosting an SPA it is important to redirect all URLs to index.html. For example in an NGINX server block you would put:

```code
root /path/to/your/project/build/;

location / {
    try_files $uri $uri/ $uri.html /index.html;
}
```



