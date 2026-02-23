---
title: Dashboards (SSR + CSR POC)
---

This folder is configured with:

- `ssr = true`
- `csr = true`
- `prerender = !import.meta.env.EVIDENCE_RUNTIME_SSR`

Set `EVIDENCE_RUNTIME_SSR=true` to make this folder runtime-rendered.

Without that env var, pages here are prerendered for static build compatibility.

## Pages

- [Realtime Dashboard](./realtime)
- [Monthly Snapshot (Per-page static override)](./monthly-snapshot)
