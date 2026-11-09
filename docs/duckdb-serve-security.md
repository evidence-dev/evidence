# DuckDB direct connector: self-hosted security model

This document describes the boundaries of the direct DuckDB connector in Evidence CLI.
It is intended for operators of **self-hosted** `evidence serve` deployments.

## Trusted local SQL versus HTTP

- `evidence query` and `evidence dev` execute SQL in a trusted developer environment.
  They intentionally preserve DuckDB's usual local-file and extension capabilities.
- `evidence serve` executes SQL submitted through `POST /api/query`. Its DuckDB
  instance is initialized with a separate, locked security configuration.
- A SQL client that can authenticate to `serve` is **not** a read-only viewer.
  SQL inside the permitted project directory may still create or modify files.
  Keep the server and its credentials restricted to trusted users.

## HTTP perimeter

- The serve command binds to `127.0.0.1` by default.
- Binding beyond loopback requires `EVIDENCE_BASIC_USER` and
  `EVIDENCE_BASIC_PASSWORD`, unless the operator explicitly sets
  `EVIDENCE_AUTH_DISABLED=true`.
- Loopback serve mode rejects non-loopback Host headers, to reduce DNS-rebinding risks.
- The query endpoint requires JSON, limits each request body to **256 KiB**,
  rejects cross-origin browser requests and rejects cross-site Fetch Metadata.
  Requests without an Origin header (for example, curl) still work.
- Basic Auth is not encryption. Use a trusted TLS reverse proxy when serving
  anything beyond the local machine.
- `EVIDENCE_AUTH_DISABLED` is for deliberately trusted/private deployments only,
  never an Internet-facing service.

## DuckDB policies in serve mode

The server initializes a DuckDB instance before letting any query access it:

1. `file_search_path` points at the canonical Evidence project directory.
2. `allowed_directories` contains only that project directory.
3. `enable_external_access = false` restricts external file and other access to
   the configured allowlist.
4. Automatic extension loading and installation, community extensions, unsigned
   extensions and persistent secrets are disabled.
5. `lock_configuration = true` prevents queries from changing the security settings.
6. Existing persistent DuckDB database files are opened with `access_mode=READ_ONLY`.
   An in-memory database remains writable in memory.

**CSV and Parquet inside the project remain supported.** Direct filesystem paths
outside the project and remote file sources are not part of the default serve
capability. An existing persistent DuckDB database **must** be located inside
the canonical project directory. The database path is checked after resolving
symlinks, and `serve` does not create a new persistent database.

### Important limitations

DuckDB's `allowed_directories` is a **read/write** allowlist. It is **not**
a read-only filesystem sandbox. The `READ_ONLY` database access mode prevents
modifications to a persistent DuckDB database, but does not by itself prevent
`COPY TO` from writing to permitted filesystem locations.

Do not place symlinks to sensitive locations inside the report's data directories.
A filesystem allowlist is not a substitute for OS-level isolation.

Use OS/container permissions to ensure that the server process cannot change
application source files, credentials, or other important assets. Mount data
read-only where practical. Do not run the service with access to secrets or
sensitive filesystem locations unrelated to the report.

SQL can also consume CPU, RAM and disk space. Request-size limits are not
query execution limits. Isolate the service with process/container resource
limits and avoid running untrusted multi-tenant workloads in a shared process.

This configuration is defense in depth, not a promise that arbitrary hostile SQL
can run safely with the privileges of the Evidence service account.

## Verification

The CI matrix runs on Linux, Windows and macOS. It checks:

- Native DuckDB loading, failure recovery and concurrent initialization.
- Legitimate CSV and Parquet access inside an Evidence project.
- Rejection of reads/writes outside the project in serve mode.
- Rejection of attempts to unlock the SQL engine configuration.
- Cross-origin HTTP requests, non-JSON bodies and oversized requests.
- Existing direct-query functionality in trusted CLI mode.

For DuckDB's security option semantics and caveats, see
[Securing DuckDB](https://duckdb.org/docs/1.5/operations_manual/securing_duckdb/overview).
