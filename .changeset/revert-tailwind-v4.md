---
'@evidence-dev/tailwind': patch
'@evidence-dev/core-components': patch
'@evidence-dev/evidence': patch
---

Revert Tailwind v4 upgrade and pin to v3.4.18 for stability. Tailwind v4 is incompatible with current Svelte 4 UI library dependencies (bits-ui, @melt-ui/svelte). Will revisit Tailwind v4 upgrade as part of Svelte 5 migration.

