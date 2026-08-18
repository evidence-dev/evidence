# Agents.md

Evidence is an agent-ready tool for creating reports from your data — markdown with inline SQL, rendered as interactive reports.

## This repo is a mirror

This is a read-only projection of a larger repo, kept in sync automatically.
Open PRs as normal and changes will be upstreamed. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

Don't add or rename files at the repo root, as they will not be synced.

## Layout

- `core/` — library containing user components, query engine, rendering primitives.
- `cli/` — the `evidence` CLI which renders interactive reports. Built with Bun.
- `docs/`
- `patches/`

## Scripts

Requires [Node](https://nodejs.org) 22.22+, [pnpm](https://pnpm.io) and [bun](https://bun.com).

| Task                                              | Command          |
| ------------------------------------------------- | ---------------- |
| Install                                           | `pnpm install`   |
| Build the CLI (to `cli/dist/evidence`)            | `pnpm cli:build` |
| Unit tests                                        | `pnpm test`      |
| Type check                                        | `pnpm check`     |
| Run the CLI locally (against the fixture project) | `pnpm evd`       |
| Docs site                                         | `pnpm docs:dev`  |
