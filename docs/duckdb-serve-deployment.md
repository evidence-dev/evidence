# DuckDB direct connector: least-privilege deployment runbook

> **Status:** candidate deployment recipe for security review, not a validated
> production certification. This example uses a locally compiled branch binary;
> the published `evidencedev/serve` image or the repository's `cli/Dockerfile`
> may contain an older Evidence release without the changes on this branch.

This runbook complements [the security model](duckdb-serve-security.md). It is
intended for a **trusted, single-tenant** Evidence report using local CSV,
Parquet, or an existing DuckDB database. It does not make hostile SQL safe.

## Before deploying

1. Use a dedicated project directory with `connection.yaml`. For this direct
   connector, a local example is:

   ```yaml
   type: duckdb
   database: ":memory:"
   ```

   An existing, project-contained persistent database can also be used and is
   opened read-only in `serve`. Creating a new persistent database belongs in
   trusted development or a data-preparation job, not in `serve`.

2. Place only **intended report data** inside the project. In particular, do
   not place secret tokens or plaintext passwords in `connection.yaml`, Markdown,
   CSV files, or other project files: permitted SQL can read in-project files.
   Keep secrets in a separate credential store, or inject supported environment
   variables at runtime. Inspect all symlinks before deployment.
3. Prepare the project as a **read-only mount**, and keep any service-writable
   locations *outside* it. The locked DuckDB SQL allowlist does not block
   `COPY TO` within the project if the OS grants write permission.
4. Use TLS termination at a trusted reverse proxy for remotely accessed
   deployments. A loopback-bound demonstration is not an Internet deployment.
5. Limit container CPU, memory, process count, filesystem permissions and
   network exposure. The HTTP body limit is not a query execution timeout.

## Build a candidate image containing the branch binary

These commands are for a Linux host with Docker and the repository checked out.
The host and container architectures must match, for example Linux amd64.
They deliberately use a **small, temporary Docker build context** rather than
copying the entire monorepo or downloading an already released CLI.

```bash
cd ~/projects/evidence
pnpm cli:build && pnpm check

test -x cli/dist/evidence
build_context="$(mktemp -d)"
cp cli/dist/evidence "$build_context/evidence"
cp docs/examples/duckdb-serve-candidate.Dockerfile "$build_context/Dockerfile"
docker build -t evidence-duckdb-candidate:local "$build_context"
rm -rf "$build_context"
```

**Important:** this recipe is not an upstream Docker release workflow. The
sample Dockerfile is pinned to Debian Bookworm and assumes the local build
produces a Linux executable compatible with that image. Test it on the target
host architecture before using it for a deployment.

## Supply HTTP credentials without committing them

Store a file outside the Git checkout, readable only by the operator. For
example `$HOME/.config/evidence/serve.env` with mode `0600`:

```text
EVIDENCE_BASIC_USER=reports
EVIDENCE_BASIC_PASSWORD=replace-with-a-long-random-secret
```

Do not commit, paste into public logs, or bake this file into an image. On
shared hosts use a secret manager rather than a long-lived plaintext env file.
Basic Auth does not encrypt requests: use a TLS reverse proxy off-machine.
Never enable `EVIDENCE_AUTH_DISABLED` for an Internet-facing deployment.

## Run with a read-only project

Choose an **absolute path** to the prepared report project:

```bash
PROJECT_DIR="/absolute/path/to/report"
SECRETS_FILE="$HOME/.config/evidence/serve.env"

test -f "$PROJECT_DIR/connection.yaml"
test -f "$SECRETS_FILE"
chmod 600 "$SECRETS_FILE"

docker run --rm --name evidence-duckdb-review \
  --read-only \
  --cap-drop=ALL \
  --security-opt no-new-privileges \
  --pids-limit=128 \
  --memory=2g --cpus=2 \
  --tmpfs /tmp:rw,nosuid,nodev,size=512m,mode=1777 \
  --mount "type=bind,src=$PROJECT_DIR,dst=/project,readonly" \
  --env-file "$SECRETS_FILE" \
  --publish 127.0.0.1:3000:3000 \
  evidence-duckdb-candidate:local
```

The read-only bind mount prevents ordinary filesystem writes to the report
project even when the SQL allowlist would otherwise allow them. The separate
writable `/tmp` supports extraction of the embedded native DuckDB library.
Do not mount `/tmp` with `noexec` until the native loader has been verified
on that platform. The container's **image root filesystem** is also read-only.

The example binds the **host-facing** port to loopback only. The CLI binds to
`0.0.0.0` *inside* the container so Docker port forwarding can work; Basic
Auth is still enforced for this non-loopback CLI bind. A real deployment must
add a trusted, TLS-enabled ingress and restrict which users can submit SQL.
Container flags reduce exposure but are not an arbitrary-SQL sandbox.

## Verify safely

In another terminal:

```bash
# curl prompts interactively for the password.
curl --fail-with-body --user reports \
  --header 'Content-Type: application/json' \
  --data '{"sql":"SELECT 42 AS answer"}' \
  http://127.0.0.1:3000/api/query
```

Then check that an intended project-local CSV or Parquet query still succeeds.
For a **disposable test project only**, attempt a `COPY TO` against a new file
in `/project/data/`: it should fail due to the read-only mount. Verify that
no file appeared, and avoid probing confidential real datasets. A failure of
that filesystem write does not imply a complete SQL read-only policy.

Stop with Ctrl+C, or `docker stop evidence-duckdb-review` from another
terminal. Temporary container data is discarded.

## Operator checklist

- [ ] The binary really comes from the reviewed branch/release.
- [ ] `connection.yaml` contains no plaintext credentials.
- [ ] Project data are mounted read-only; no writable bind mounts overlap.
- [ ] Writable temporary storage is isolated and appropriately sized.
- [ ] Runtime user is non-root and has minimal OS permissions.
- [ ] Authentication is enabled; remote access uses TLS and access controls.
- [ ] Network egress and external secret sources are restricted where possible.
- [ ] CPU, memory, process limits, logs and alerts match expected report traffic.
- [ ] Legitimate CSV/Parquet reads work and test-project writes fail.
- [ ] The deployment does not serve mutually untrusted tenants.
- [ ] The report and the host have a backup/rollback plan.

See [DuckDB's security guidance](https://duckdb.org/docs/1.5/operations_manual/securing_duckdb/overview)
for why SQL restrictions must be combined with operating-system isolation.
