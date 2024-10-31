---
sidebar_position: 1
title: CLI
hide_title: true
description: Commands to start, install, develop, and build Evidence apps from the command line.
---

# CLI Reference

## Commands

```sql commands
select '<code>npx degit evidence-dev/template my-project</code>' as "CLI", '<code>Evidence: New Evidence Project</code>' as "VS Code", 'Create a new project from the template' as "Description", 0 as row_num UNION ALL
select '<code>npm run sources</code>' as "CLI", '<code>Evidence: Run Sources</code>' as "VS Code", 'Extract data from sources' as "Description", 1 as row_num UNION ALL
select '<code>npm run dev</code>' as "CLI", '<code>Evidence: Start Server</code>' as "VS Code", 'Start the development server in the current directory' as "Description", 2 as row_num UNION ALL
select '<code>npm run build</code>' as "CLI", '<code>Evidence: Build</code>' as "VS Code", 'Build the app for production' as "Description", 3 as row_num UNION ALL
select '<code>npm run build:strict</code>' as "CLI", '<code>Evidence: Built Strict</code>' as "VS Code", 'Build, but fails on query or component errors' as "Description", 4 as row_num UNION ALL
select '<code>npm run preview</code>' as "CLI", 'N/A' as "VS Code", 'Preview the built site' as "Description", 5 as row_num UNION ALL
select '<code>Ctrl / Cmd</code> + <code>C</code>' as "CLI", '<code>Evidence: Stop Server</code>' as "VS Code", 'Stop the dev server (when running)' as "Description", 6 as row_num UNION ALL
select '<code>r</code>' as "CLI", 'N/A' as "VS Code", 'Restart the dev server (when running)' as "Description", 7 as row_num
ORDER BY row_num
```

<DataTable data={commands} formatColumnTitles=false>
    <Column id="CLI" wrap contentType=html/>
    <Column id="VS Code" contentType=html/>
    <Column id="Description" wrap/>
</DataTable>


## Options

Append flags with an extra `--` after the command to modify behavior.

For example, `npm run dev -- --port 4000` will start the development server on port 4000.

Some of the most common are:

```sql options
select '<code>sources</code>' as "Command", '<code>--changed</code>' as "Flag", 'Run sources whose queries have changed' as "Description", null as "Detail", 0 as row_num UNION ALL
select '<code>sources</code>' as "Command", '<code>--sources [source_name]</code>' as "Flag", 'Run sources from the specified sources' as "Description", 'Seperate with commas <code>--sources source1,source2</code>' as "Detail", 1 as row_num UNION ALL
select '<code>sources</code>' as "Command", '<code>--queries [query_name]</code>' as "Flag", 'Run the specified queries' as "Description", 'Seperate with commas' as "Detail", 2 as row_num UNION ALL
select '<code>sources</code>' as "Command", '<code>--debug</code>' as "Flag", 'Show debug output' as "Description", null as "Detail", 3 as row_num UNION ALL
select '<code>dev</code>' as "Command", '<code>--open [path]</code>' as "Flag", 'Open browser to <code>path</code> on startup' as "Description", 'Default <code>--open /</code> opens in root of the project' as "Detail", 4 as row_num UNION ALL
select '<code>dev</code>' as "Command", '<code>--host [host]</code>' as "Flag", 'Specify hostname' as "Description", '<code>--host 0.0.0.0</code> can be helpful in containers' as "Detail", 5 as row_num UNION ALL
select '<code>dev</code>' as "Command", '<code>--port <port></code>' as "Flag", 'Specify port' as "Description", 'Automatically increment if default <code>3000</code> is in use' as "Detail", 6 as row_num
ORDER BY row_num
```

<DataTable data={options} formatColumnTitles=false>
    <Column id="Command" wrap contentType=html/>
    <Column id="Flag" wrap contentType=html/>
    <Column id="Description" wrap/>
    <Column id="Detail" wrap contentType=html/>
</DataTable>


Evidence's `dev` and `build` commands run using Vite, and so support [Vite's options](https://vitejs.dev/guide/cli.html#options).

Evidence's `preview` command runs using `npx serve` and supports [Serve's options](https://github.com/vercel/serve/blob/main/source/utilities/cli.ts#L30)

## Environment Variables

You can set environment variables to configure Evidence in production. Most of these are used to set database credentials securely.

The format of environment variables for database credentials is `EVIDENCE_SOURCE__[source_name]__[variable_name]`.

You can copy all your current environment variable values from the settings page at [localhost:3000/settings](http://localhost:3000/settings).

N.B. Environment variables are **case sensitive**, so you should preserve the case specified in the settings page.

### .env Files

Evidence will read in environment variables from a `.env` file in the root of your project. This is useful for local development.

### Environment Variables in Source Queries

Environment variables to be used in source queries should be prefixed with `EVIDENCE_VAR__` (note the double underscore). They can be used in source queries with `${EVIDENCE_VAR__variable_name}`.

```bash
EVIDENCE_VAR__customer_name="Acme Corporation"
```

```bash
select *
from orders
where customer_name = '${customer_name}'
```

The quotes would be omitted if the variable was not a string.

### Environment Variables in Pages

Environment variables to be used in pages should be prefixed with `VITE_`. They can be accessed with `import.meta.env.VITE_variable_name`.

`.env`
```bash
VITE_customer_attribute=premium
```

`index.md`
```svelte
&lt;script&gt;
  const customer_attribute = import.meta.env.VITE_customer_attribute;
&lt;/script&gt;

{#if customer_attribute === 'premium'}

Premium content

{:else if customer_attribute === 'free'}

Free content

{/if}
```