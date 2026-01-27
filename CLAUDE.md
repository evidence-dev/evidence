# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About Evidence

Evidence is an open-source, code-based BI tool that transforms markdown files containing SQL queries into interactive data applications. It generates static websites where SQL queries run against parquet files using DuckDB WASM in the browser.

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm (install globally: `npm i -g pnpm`)

### Initial Setup

```bash
pnpm install
pnpm run sources:example-project
pnpm run dev:core-components
```

In a separate terminal:

```bash
pnpm run dev:example-project
```

Access the development workspace at `localhost:3000`.

### Cache Issues

If you encounter `Error [ERR_MODULE_NOT_FOUND]`, clean caches:

```bash
rm -rf ./**/.parcel-cache node_modules ./**/dist
pnpm i
```

## Common Commands

### Development

- `pnpm run dev:example-project` - Run example project in dev mode
- `pnpm run dev:docs` - Run documentation site in dev mode
- `pnpm run dev:test-env` - Run test environment
- `pnpm run dev:core-components` - Watch mode for core components (required for development)
- `pnpm run dev:storybook` - Run Storybook for component development

### Building

- `pnpm run build:example-project` - Build example project
- `pnpm run build:production` - Build with strict mode enabled
- `pnpm run package:core-components` - Build core components package
- `pnpm run build:evidence` - Build Evidence CLI package
- `pnpm run build:preprocess` - Build preprocessor
- `pnpm run build:tailwind` - Build Tailwind configuration

### Data Sources

- `pnpm run sources:example-project` - Run source queries for example project
- `pnpm run sources:docs` - Run source queries for docs
- `pnpm run sources:test-env` - Run source queries for test environment

### Testing

- `pnpm test` - Run all tests (unit and integration)
- `pnpm run test:component-utilities:watch` - Watch mode for component utilities tests
- For E2E tests in a specific project: `cd e2e/<project-name> && pnpm test:dev` or `pnpm test:preview`

### Code Quality

- `pnpm run format` - Format all code (must run before PRs)
- `pnpm run lint` - Check formatting and linting

### Releases

- `pnpm changeset` - Add changeset for version bumps (required for PRs)

## Monorepo Architecture

This is a PNPM workspace monorepo with three main areas:

### packages/ - Core packages organized by function

**datasources/** - Database connector plugins

- Each datasource exports: `testConnection()`, `processSource()` or `getRunner()`
- Common types/utilities in `@evidence-dev/db-commons`
- Examples: bigquery, postgres, duckdb, snowflake, mysql, mssql, sqlite, etc.

**lib/** - Core libraries

- `sdk/` - Modern build orchestration, plugin system, query management
- `preprocess/` - Legacy markdown preprocessor (being phased out)
- `universal-sql/` - DuckDB WASM wrapper for client and server
- `component-utilities/` - Framework-agnostic data manipulation helpers
- `db-commons/` - Shared database type definitions
- `telemetry/` - Analytics

**ui/** - User interface packages

- `core-components/` - Svelte component library (charts, tables, inputs, etc.)
- `icons/` - Icon components
- `tailwind/` - Tailwind configuration and theming

**evidence/** - Main CLI and template distribution package

**extension/** - VSCode extension

### sites/ - Example projects and documentation

- `example-project/` - Main development workspace
- `docs/` - Documentation site
- `test-env/` - Testing environment

### e2e/ - End-to-end test projects

- Each subdirectory is a complete Evidence project testing specific features
- Uses Playwright for browser automation
- Run with `pnpm test:dev` (dev mode) or `pnpm test:preview` (production build)

## How Evidence Works: Markdown + SQL → Website

### Build-Time Processing

1. **Query Extraction** (`@evidence-dev/sdk/build/svelte`):
   - Preprocessor chain converts markdown to Svelte components
   - Extracts SQL code blocks with query names (` ```sql my_query `)
   - Transforms query syntax and handles interpolation
   - Injects query execution logic and auto-imports components

2. **Data Source Processing**:
   - `evalSources` loads datasource plugins and executes `.sql` files from `sources/` directory
   - Results converted to Apache Arrow format and written as parquet files to `.evidence-queries/`
   - `manifest.json` tracks all available data tables and their locations

3. **Static Site Generation**:
   - SvelteKit builds site with SSR
   - During prerendering, queries run against native DuckDB
   - Results cached and embedded in HTML pages

### Runtime Execution

1. **Page Load**: Browser loads manifest.json and initializes DuckDB WASM
2. **Query Registration**: DuckDB registers parquet files from manifest
3. **Query Execution**: Query stores fetch data from DuckDB when accessed
4. **Reactivity**: Svelte components react to query data changes

## Key Package Relationships

```
@evidence-dev/evidence (CLI)
├── @evidence-dev/sdk (orchestration & build system)
│   ├── @evidence-dev/universal-sql (DuckDB WASM runtime)
│   └── Plugin system (datasources, components, layouts)
├── @evidence-dev/preprocess (legacy markdown processor)
└── @evidence-dev/telemetry

@evidence-dev/core-components (UI library)
├── @evidence-dev/component-utilities (data manipulation)
├── @evidence-dev/icons
└── @evidence-dev/tailwind
```

## Important Architectural Patterns

1. **Plugin Architecture**: Datasources and components dynamically loaded, enabling extensibility
2. **Dual Preprocessing**: Legacy (`preprocess`) and modern (`sdk`) systems coexist during migration
3. **SSR + Client Hydration**: Queries prerendered for initial load, then interactive via WASM
4. **Parquet as Intermediate Format**: Universal, compressed, columnar storage for query results
5. **DuckDB Everywhere**: Same query engine in development, build, and production
6. **Reactive Query Stores**: Svelte stores provide reactive data binding

## Development Workflow

### Making Changes to Core Components

1. Run `pnpm run dev:core-components` (watches and rebuilds on changes)
2. Run `pnpm run dev:example-project` in another terminal
3. Edit components in `packages/ui/core-components/src/`
4. Changes hot-reload in browser

### Creating a New Datasource

1. Copy an existing datasource package structure
2. Implement required interface: `testConnection()` and `processSource()` or `getRunner()`
3. Use `@evidence-dev/db-commons` for type standardization
4. Add tests following existing patterns
5. Link in root `package.json` devDependencies
6. Run `pnpm install` to register workspace link

### Adding E2E Tests

Follow the comprehensive guide in `e2e/README.md`. Key steps:

1. Create Evidence project from template
2. Replace dependencies with `workspace:*` versions
3. Configure Playwright with shared config
4. Write tests using `test-utils.js` helpers
5. Run with `pnpm test:dev` or `pnpm test:preview`

## Pull Request Requirements

Before submitting a PR:

1. **Format code**: `pnpm run format`
2. **Add changeset**: `pnpm changeset`
   - Select packages that changed
   - Most changes are patch bumps unless breaking or adding major features
   - Commit the generated `.changeset/*.md` file
3. **Test changes**: Ensure tests pass with `pnpm test`
4. **Test in example project**: Verify changes work in `sites/example-project`

## File Structure Notes

- `.evidence/template/` - Generated SvelteKit project structure (gitignored)
- `.evidence-queries/` - Generated parquet files and query cache (gitignored)
- `sources/` - SQL query definitions organized by datasource
- `pages/` - Markdown files that become website pages (in Evidence projects)
- `components/` - Custom Svelte components (in Evidence projects)

## Debugging Tips

### Query Issues

- Check `.evidence-queries/` for generated parquet files
- Inspect `manifest.json` for registered tables
- Look at browser console for DuckDB WASM errors
- For SSR queries, check `.evidence-queries/cache/` for cached results

### Build Issues

- Clean caches with `rm -rf ./**/.parcel-cache node_modules ./**/dist`
- Verify `pnpm run build:preprocess` and `pnpm run build:tailwind` ran during postinstall
- Check that `pnpm run dev:core-components` is running when developing

### Component Development

- Use Storybook: `pnpm run dev:storybook`
- Unit tests: `pnpm --filter ./packages/ui/core-components test:unit`
- Check component utilities: `pnpm run test:component-utilities:watch`

## Technology Stack

- **Framework**: SvelteKit 2.x with Svelte 4.x
- **Build**: Vite 5.x, Parcel for component packaging
- **Database**: DuckDB (native in Node, WASM in browser)
- **Data Format**: Apache Arrow and Parquet
- **Charts**: ECharts 5.x
- **Maps**: Leaflet
- **Styling**: Tailwind CSS 3.x
- **Testing**: Playwright (E2E), Vitest (unit), uvu (some packages)
- **Monorepo**: PNPM workspaces
- **Package Manager**: pnpm 8.15.9 (specified in packageManager field)

## Important Notes

- Always run `pnpm run dev:core-components` when developing - it's required for HMR
- The preprocessor chain is critical - changes to markdown/SQL syntax require preprocessor updates
- Query interpolation uses template literals: `WHERE category = '${inputs.category}'`
- Datasource plugins must handle streaming for large result sets
- E2E test environment variables for datasource credentials go in `.env` files per datasource package
