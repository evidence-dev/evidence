# CLI dev playground

This directory is the local Evidence project the CLI is exercised against during development. Drop a `connection.yaml` here (gitignored) pointing at your dev warehouse and the scripts below will pick it up.

## Setup

Create `cli/test-environment/connection.yaml`. Snowflake + dbt source files for this directory will be added in follow-up work — for now a minimal config is enough to exercise CLI commands.

## Run from the monorepo root

```bash
# A CLI command, against this directory (the default)
pnpm evd help
pnpm evd query --sql "select 1"

# Dev server, against this directory (vite dev under the hood, no binary build)
pnpm evd dev
```

`validate` and `docs` go through the SvelteKit HTTP layer (which uses vite-only constructs), so they need either a binary build (`pnpm cli:build`) or a running dev server. See the main `cli/README.md` for the full breakdown.

These scripts work from anywhere inside the monorepo — they don't `cd` into this directory, they pass `--project cli/test-environment` to the CLI so `process.cwd()` semantics still resolve correctly. To target a different project, append `--project ./other/path` to either script.

## Behind the scenes

- `--project <path>` chdirs the CLI process and sets `EVIDENCE_PROJECT_CWD` so the SvelteKit dev server (which runs with `cwd` = the cli package) can find your project files via `getProjectCwd()`.
- `evd dev` detects "running from source" via `process.execPath` and routes through `vite dev` instead of the compiled Bun server. Browser auto-open is off by default in source mode; pass `--open` to opt in.
