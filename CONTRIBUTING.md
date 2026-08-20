# Contributing

Thanks for your interest in improving Evidence!

## This repository is a mirror

This repo is a read-only projection of a wider repo, and is kept in sync automatically. Issues and pull requests are welcome here, but changes are merged upstream in the internal repo. You can still make PRs here as normal.

## How pull requests work

1. Open a PR. CI runs, and maintainers will review here.
2. When it's ready, a maintainer will move the PR to the internal repo, where it goes through internal CI and lands on `main`.
3. On merge the sync pushes your change back out to this repo, preserving your commit authorship.

The original PR will be marked as closed rather than merged, as the merge happens in the internal repo.

## Build from Source

Requires [Node](https://nodejs.org) 22.22+, [pnpm](https://pnpm.io) and [bun](https://bun.com).

```bash
pnpm install
pnpm run cli:build
```

The binary is written to `cli/dist/evidence`.

To run the CLI from source without building:

```bash
pnpm evd help
pnpm evd dev
```

## Running tests

Unit tests use [Vitest](https://vitest.dev) and live next to source as `*.test.ts`, mostly under `core/` and `cli/`.

```bash
pnpm test              # run all tests
pnpm test -- -t "name" # filter by test name
pnpm check             # type check (core + cli)
```

## Reporting issues

Open issues in this repo. Please include your CLI version (`evidence version`) and steps to reproduce.
