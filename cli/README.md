# EVD

Evidence Studio local development CLI.

## Quick Start

```bash
# Install dependencies (from monorepo root)
pnpm install

# Run a CLI command from source — instant, no build (defaults to cli/test-environment)
pnpm evd query "select 1"
pnpm evd help

# Run the dev server from source against the test playground
pnpm evd dev

# Build the CLI binary (requires Bun installed globally)
pnpm cli:build

# Run the binary
./cli/dist/evidence
./cli/dist/evidence --help
./cli/dist/evidence dev --port 8080
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Build Time                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  src/                    adapter/                    cli/                   │
│  (SvelteKit app)         (custom adapter)            (CLI entry point)      │
│       │                        │                          │                 │
│       ▼                        ▼                          ▼                 │
│  ┌─────────┐            ┌─────────────┐           ┌──────────────┐         │
│  │ vite    │───────────▶│ 1. Build SK │           │ index.ts     │         │
│  │ build   │            │ 2. Embed    │◀──────────│ args.ts      │         │
│  └─────────┘            │    assets   │           │ server.ts    │         │
│                         │ 3. Compile  │           └──────────────┘         │
│                         └──────┬──────┘                                    │
│                                │                                            │
│                                ▼                                            │
│                         ┌─────────────┐                                    │
│                         │  dist/evd   │  ← Single binary                   │
│                         └─────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              Run Time                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  $ evd dev --port 3000                                                       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Bun.serve()                                  │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │   │
│  │  │ Static Assets   │    │ Prerendered     │    │ SvelteKit SSR   │ │   │
│  │  │ (embedded)      │    │ HTML (embedded) │    │ (dynamic)       │ │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
.
├── adapter/
│   └── index.js          # Custom SvelteKit adapter
│                         # - Discovers & embeds static assets
│                         # - Generates manifest
│                         # - Compiles binary with Bun
│
├── cli/
│   ├── index.ts          # CLI entry point
│   ├── args.ts           # Argument parsing, help, banner
│   └── server.ts         # Bun HTTP server + SvelteKit integration
│
├── src/
│   ├── routes/           # SvelteKit routes (the actual app)
│   ├── lib/              # Shared components
│   └── app.html          # HTML template
│
├── static/               # Static assets (favicon, etc.)
├── dist/                 # Build output (gitignored)
│   └── evd               # The compiled binary
│
├── svelte.config.js      # SvelteKit config (uses ./adapter)
├── vite.config.ts        # Vite config
└── package.json
```

## How It Works

### 1. Asset Embedding

The magic that makes a single binary possible. During build:

```javascript
// adapter/index.js generates imports like:
import favicon_SVG_a1b2 from '../client/favicon.svg' with { type: 'file' };

export const assetMap = new Map([
	['/favicon.svg', favicon_SVG_a1b2]
	// ... all static files
]);
```

Bun's `{ type: "file" }` import attribute embeds the file contents into the binary.

### 2. The Adapter

`adapter/index.js` is a custom SvelteKit adapter that:

1. **Writes SvelteKit output** - client assets, prerendered HTML, server code
2. **Generates asset imports** - creates `assets.generated.ts` with embedded file references
3. **Generates manifest** - SvelteKit's routing manifest
4. **Compiles** - runs `bun build --compile` to create the binary

### 3. The CLI

`cli/` contains the runtime code that gets compiled:

- `args.ts` - Parses `--port`, `--help`, `--version`, etc.
- `server.ts` - Starts Bun.serve(), handles static assets & SSR
- `index.ts` - Wires it together, handles commands

### 4. Request Flow

```
Request → Bun.serve()
            │
            ├─→ Static asset? → Serve from embedded assetMap
            │
            ├─→ Prerendered route? → Serve embedded HTML
            │
            └─→ Otherwise → SvelteKit SSR
```

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.2.18+ (required for running CLI source and for binary compilation)
- [pnpm](https://pnpm.io) (for package management)

### Day-to-day workflow

| What you're working on              | Run              | Build needed? |
| ----------------------------------- | ---------------- | ------------- |
| `evidence dev` flow / Svelte routes | `pnpm evd dev`   | no            |
| Other CLI commands                  | `pnpm evd <cmd>` | no            |
| Final binary smoke test             | `pnpm cli:build` | yes           |

Both scripts default to the `cli/test-environment` playground regardless of where you invoke them from. Pass `--project <path>` to override the target directory.

### Quick Install: Add `evidence` to Your PATH

After building the CLI binary, you can add it to your PATH for convenient global access:

```bash
# Symlink the binary to a directory in your PATH (requires sudo)
sudo ln -sf "$(pwd)/cli/dist/evidence" /usr/local/bin/evidence

# Verify it works
which evidence
evidence --version
```

**Benefits of this approach:**
- Always reflects the latest `dist/evidence` after rebuilds (no re-install needed)
- Works everywhere (scripts, subshells, GUI tools)
- Easy to revert (see below)

**Undo the symlink:**
```bash
# Remove the symlink
sudo rm /usr/local/bin/evidence

# If you want to restore the previous binary (backup created during install)
sudo mv /usr/local/bin/evidence.old /usr/local/bin/evidence
```

**Note:** If you built the CLI elsewhere, replace the path accordingly. You can also prepend a user bin directory to your PATH instead of using `/usr/local/bin` if you prefer not to use `sudo`.

#### Examples — all run from the monorepo root

```bash
pnpm evd help
pnpm evd query "select 1"                  # against cli/test-environment (NDJSON)
pnpm evd --project ./some/dir validate     # override to an arbitrary project
pnpm evd dev --port 5173                   # extra flags forward to the dev server
```

### Output formats

Data commands are **machine-readable by default; the human view is opt-in** via
`--verbose`. Output is identical whether or not stdout is a terminal (there is
no TTY detection). All formatting is centralized in `cli/output.ts`
(`printResult` / `renderResult` / `fail`) — commands never call `JSON.stringify`
or render tables directly.

Defaults (no flags):

- Result sets (`query`, `describe`, `schema`) → **NDJSON**, one JSON object per line.
- Name lists (`tables`) → **plain `schema.table`, one per line**.
- Structured/list results (`connectors`, `models`, `lineage`, `docs`) → **compact JSON**.
- No ANSI color and no box-drawing characters, ever, by default.

Shared flags on every data command:

| Flag                | Effect                                                                      |
| ------------------- | --------------------------------------------------------------------------- |
| `--verbose`         | Human view: pretty aligned table + full/extra columns                       |
| `--format <fmt>`    | `json`, `ndjson`, `csv`, `table` (`table` = pretty). Wins over `--verbose`. |
| `--columns <a,b,c>` | Select and order columns                                                    |
| `--limit <n>`, `-l` | Limit rows (`query` defaults to 1000; a stderr note flags truncation)       |
| `--all`             | Remove the row limit                                                        |
| `--no-color`        | Disable color (the `NO_COLOR` env var is also honored)                      |

Errors go to stderr; under `--format json`/`ndjson` they are emitted as
`{"error":<msg>,"code":<str>}`. Status/progress chatter also goes to stderr.

> **Breaking changes** (vs. the previous human-first defaults):
>
> - Default output is now NDJSON/plain/compact-JSON instead of pretty tables.
>   Use `--verbose` for the old human view.
> - `-v` now means `--verbose`. Use `--version` (or the `version` subcommand)
>   for the version.
> - `--columns` now takes a value (column selection) instead of being a boolean
>   "columns-only" toggle — that role is now `describe`'s default.
> - `--format` is long-form only; `-o`/`--output <path>` keeps its "write to
>   file" meaning. `--json` still works as an alias for `--format json`.
> - `query` no longer pretty-prints by default and caps output at 1000 rows
>   unless `--all` is passed.

`evd dev` detects that it's running from source (via `process.execPath`) and routes through `vite dev` automatically — same auth + Studio health check as the binary, then spawns `vite dev`. Browser auto-open defaults to off in source mode (pass `--open` to opt back in); the binary still auto-opens by default.

#### What works under `evd` (no build)

The commands that are pure TypeScript and don't need the SvelteKit bundle: `help`, `version`, `login`, `logout`, `whoami`, `orgs`, `switch`, `token`, `query`, `tables`, `describe`, `schema`, `connectors`, `models`, `lineage`, `upgrade`.

#### What still needs `cli:build` (or the dev server)

`validate` and `docs` go through SvelteKit's HTTP layer, which uses `import.meta.glob` — a vite-only construct. Two options:

- Run `pnpm cli:build` once, then `./cli/dist/evidence validate` reflects the latest source. (You only need to rebuild when SvelteKit-side code changes.)
- Or run `pnpm evd dev` and hit the same endpoints directly: `curl http://localhost:3000/api/validate`.

### Other commands

```bash
pnpm cli:build       # Build production binary
pnpm cli:check       # Type check
pnpm cli:lint        # Lint & format check
pnpm --filter @evidence/cli format
```

### Dev vs Production

| Aspect    | `pnpm evd dev`            | `./dist/evidence`  |
| --------- | ------------------------- | ------------------ |
| Server    | Vite dev server (spawned) | Bun.serve()        |
| Assets    | Served from disk          | Embedded in binary |
| HMR       | Yes                       | No                 |
| Auto-open | No (pass `--open`)        | Yes                |
| SSR       | Yes                       | Yes                |
| Size      | N/A                       | ~50MB single file  |

### Adding CLI Commands

Edit `cli/args.ts` to add new commands:

```typescript
// In parseArgs():
if (firstArg === 'mycommand') command = 'mycommand';

// In cli/index.ts:
case 'mycommand':
  // do something
  break;
```

Data-producing commands should route their results through `printResult` (from
`cli/output.ts`) using the shared `args.output` options, rather than calling
`JSON.stringify` or rendering tables themselves — this keeps the machine-first
defaults, `--format`, `--columns`, `--limit`, and color handling consistent
across every command.

### Modifying the Adapter

The adapter in `adapter/index.js` controls the build process. Key functions:

- `discoverAssets()` - Finds all files to embed
- `generateAssetImports()` - Creates the import statements
- `adapt()` - Main build orchestration

## Docker Image

The CLI is published as a Docker image, `evidencedev/serve` ([Docker Hub](https://hub.docker.com/r/evidencedev/serve)), so that self-hosting a project is a two-line `Dockerfile`:

```docker
FROM evidencedev/serve:latest
COPY --chown=evidence:evidence . /project
```

That's the whole point of the image — a user self-hosting a project should never have to figure out how to install the CLI inside a container. `cli/Dockerfile` handles fetching the right binary for the architecture, CA certificates (without them, TLS to the warehouse fails at runtime), a non-root `evidence` user, `/project` as the working directory, honouring a platform-provided `$PORT`, and starting `evidence serve --host 0.0.0.0`. The user's layer is just "copy my project in".

### It ships on a version bump

The image does not build the CLI. Its first stage downloads an already-published binary from Vercel Blob:

```
https://.../cli/v${EVIDENCE_VERSION}/evidence-${target}
```

So a new image only appears when a new CLI version is released. In `.github/workflows/cli-release.yml`, the `docker` job has `needs: release` — it cannot run until the release job has uploaded binaries for that version. There is no way to rebuild the image against unreleased CLI code: bump `VERSION` in `cli/cli/args.ts`, add the `cli-release` label to the PR, and merge.

Also bump the `ARG EVIDENCE_VERSION` default in `cli/Dockerfile` to match. CI overrides it, but anyone running `docker build -f cli/Dockerfile .` by hand gets whatever the default says.

### Tags and platforms

- `evidencedev/serve:<version>` on every release.
- `evidencedev/serve:latest` only for stable versions — a version containing `-` (`0.9.2-alpha.1`) never moves `latest`.
- Built for `linux/amd64` and `linux/arm64` via QEMU + Buildx. Pushed with the `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` secrets.

The `docker` job lives in the release workflow rather than its own file because the `cli-v*` tag is pushed with `GITHUB_TOKEN`, which cannot trigger another workflow.

## Telemetry

The CLI reports anonymous usage — to opt out set EVIDENCE_TELEMETRY_DISABLED=1 or DO_NOT_TRACK=1

## License

MIT
