# DuckDB direct connector: upstream PR readiness

This is a maintainer-facing review plan for the DuckDB direct connector
implemented on `dawidthecactus:feat/duckdb-direct-connector` against
`evidence-dev/evidence:main`. The upstream repository is a public mirror:
maintainers review a public PR and move accepted changes into their internal
repository (see `CONTRIBUTING.md`). The implementation addresses
[issue #3341: Add a DuckDB direct connector](https://github.com/evidence-dev/evidence/issues/3341),
which specifically requests queries over local disk and Parquet data.

## Feature scope

- Direct `duckdb` option in `connection.yaml`, with project-relative database
  and CSV/Parquet paths.
- Project-scoped `:memory:` instances, persistent database support, schema
  metadata and JSON-safe result conversion.
- Native DuckDB library embedded in the compiled Bun CLI on Linux, Windows
  and macOS; fault injection, concurrent load, cleanup and retry tests.
- Native DuckDB result data contract: large integer and decimal precision,
  DATE/TIMESTAMP normalization, JSON-safe nested values, INTERVAL metadata,
  nulls and collision-free duplicate SQL aliases.
- Restrictive `evidence serve` mode: HTTP boundary validation, project-contained
  file allowlist, locked DuckDB settings, extension restrictions and read-only
  existing persistent databases.
- Cross-platform native CI, security regression tests, filesystem audit and
  operator-facing documentation.

## Security assumptions and review findings

| Area | What was verified | Residual risk / decision |
| --- | --- | --- |
| HTTP boundary | Same-origin guard, JSON-only, 256 KiB body limit, host check and existing Basic Auth | Trusted clients still submit arbitrary SQL. Reverse proxy/TLS are operator responsibilities. |
| File paths | CSV and Parquet in project work; tested off-project read/write attempts fail | The allowlist is **read/write**, not a read-only policy. |
| Symlinks | Tested symlink to an outside text fixture did not expose contents | This is not proof against every symlink/race condition. Use read-only mounts and inspect data trees. |
| Native loader | Fault injection/retry and 24-way concurrent initialization tested | A DLL may remain on Windows until process exit; stale directories are reclaimed on a later run. |
| Resource usage | HTTP payload has a size limit | SQL compute/memory/time have no comparable blanket limit. Use host/container quotas. |
| Secrets | Persistent DuckDB secrets/extension autoload are disabled in serve | Do not place plaintext credentials inside the readable Evidence project. |
| Persistent database | Existing database inside project opens read-only; outside and symlink-escaped DB paths are rejected | Separate database read-only mode from other file writes. |

`evidence query` and `evidence dev` intentionally retain trusted-developer
capabilities. The hardened policy applies when `EVIDENCE_SERVE=1`.
Never describe this implementation as a sandbox for untrusted SQL or as a
general-purpose multi-tenant SQL execution service.

See [security model](duckdb-serve-security.md) and
[least-privilege deployment runbook](duckdb-serve-deployment.md).
For the column and value compatibility contract, see
[DuckDB data quality and metadata](duckdb-data-contract.md).

## Validation evidence

The branch's native-binary workflow tests Linux (`ubuntu-24.04`), Windows
(`windows-2022`) and macOS Intel (`macos-15-intel`) with:

1. Vitest tests of the loader, connector, security configuration, Host guard
   and SQL HTTP request validator.
2. Standalone CLI build and CLI/core typechecks.
3. Native SQL, CSV, Parquet, failure recovery and concurrent HTTP smoke tests.
4. Serve filesystem audit, including an in-project `read_text` control,
   in-project write observation and outside-project symlink read check.

**Snapshot (November 9, 2026):** GitHub Actions run
[`42659474948`](https://github.com/dawidthecactus/evidence/actions/runs/42659474948)
was green on all three platforms at commit `fec20847`. Ubuntu additionally
passed the **OS-enforced read-only project container test**; Windows and macOS
run the other native/security checks, but intentionally skip this Docker-only
Linux test. Repeat the checks after upstream integration or code changes.

Suggested maintainer review commands at the repository root:

```bash
pnpm install --frozen-lockfile
pnpm --filter @evidence/cli exec vitest run \
  cli/duckdb-native-runtime.test.ts \
  cli/connection/duckdb.test.ts \
  cli/connection/duckdb-data-contract.test.ts \
  cli/connection/duckdb-security.test.ts \
  cli/serve-host.test.ts \
  src/lib/server/query-request-guard.test.ts
pnpm cli:build
pnpm check
node cli/scripts/smoke-duckdb-binary.mjs
node cli/scripts/audit-duckdb-serve-filesystem.mjs
git diff --check
```

The filesystem audit intentionally **reports**
`IN_PROJECT_WRITE_ALLOWED` rather than failing: that result documents the
current DuckDB allowlist boundary. The symlink content escape check does fail
if an outside-project fixture becomes readable.

## Upstream integration before opening the PR

As of November 9, 2026, comparison of this fork branch with upstream
`main` showed **76 branch commits, 48 changed files and 10 upstream commits
not yet integrated** at commit `fec20847`. These numbers are a snapshot, not
a live status.

The recent upstream changes include a new Amazon Athena connector and query
engine changes. Recheck these integration points in particular:
`connection-schema.ts`, connector registry, `warehouse-mode.ts`,
`sql-dialect.ts`, the CLI query dispatcher and the lockfile.

Do not force-push or perform an unreviewed mass rebase on the shared feature
branch. A safe local integration sequence is:

```bash
cd ~/projects/evidence
git status --short
git remote -v
# If missing: git remote add upstream https://github.com/evidence-dev/evidence.git
git fetch upstream main
git log --oneline HEAD..upstream/main
git diff --stat upstream/main...HEAD
```

Review the output first. If the working tree is clean and integration is
approved, merge upstream `main` into the feature branch, resolve conflicts,
run the full suite, and push the tested merge. This avoids rewriting the
already published branch history. Do **not** merge automatically without
reviewing the conflicts and changed behavior.

## Proposed PR strategy

**Recommended:** one coherent `feat(cli): add embedded DuckDB direct connector`
PR with its security protections and cross-platform tests included. Shipping
the `serve` SQL route separately from its filesystem safeguards would create
an avoidable unsafe intermediate state. The current diff is large, so make the
PR description structured and explicitly invite feedback on scope.

If maintainers request a split, arrange stacked PRs so that no intermediate
merge exposes unsecured DuckDB SQL on `serve`. Reasonable review boundaries
are core registration/metadata, CLI runtime, and hardened self-hosting,
but preserve feature gating/dependencies between them.

Before creating the PR:

- [x] Document trusted CLI vs. HTTP SQL security boundaries.
- [x] Explain write permissions, symlink limitations and host isolation.
- [x] Demonstrate 3-platform native CI and security smoke tests.
- [x] Provide a **candidate** container recipe using the branch build.
- [x] Run candidate read-only container scenario on Linux CI and record the
      actual result (`READ_ONLY_CONTAINER_SMOKE_OK`).
- [ ] Integrate upstream `main` and rerun all three platform jobs.
- [ ] Review the full diff for unrelated edits, secrets and generated files.
- [ ] Confirm whether CI workflow should retain branch-specific push triggering
      or run only on appropriately filtered pull requests.
- [ ] Obtain maintainer feedback if the single-PR scope is too large.
- [ ] Open the public PR against `evidence-dev/evidence:main`.

## Proposed PR summary (editable)

**Title:** `feat(cli): add cross-platform DuckDB direct connector`

**Related issue:** `Refs #3341` (the public mirror's contribution process
may close the PR after internal merge).

**Summary:** Introduces an embedded DuckDB connection type for local CSV,
Parquet and DuckDB files without an external warehouse. Includes a native
Bun CLI loader for three operating systems, connector metadata, project
isolation, and production `serve` restrictions.

**Testing:** DuckDB integration tests, loader fault injection and concurrency;
standalone executable SQL/CSV/Parquet/HTTP smoke tests; serve file-access and
HTTP security tests on Ubuntu, Windows and macOS GitHub Actions runners.

**Security note:** `serve` restricts file access to a project allowlist but
does not safely execute hostile arbitrary SQL. Operators must enforce
authentication, TLS, read-only project mounts and resource limits. Trusted
CLI and dev mode intentionally retain full DuckDB functionality.

**Reviewer focus:** native binding packaging, lifecycle and Windows cleanup;
project-scoped `:memory:` caching; compatibility with other connector
registries; security boundaries; CI duration and workflow triggers.

## Out of scope

- A universal SQL read-only parser or sandbox.
- Automatic migration of existing external DuckDB databases into a project.
- Remote DuckDB/MotherDuck authentication changes.
- New multi-tenant authorization or fine-grained query policies.
- Claiming that Docker or filesystem allowlists prevent all adversarial SQL.
