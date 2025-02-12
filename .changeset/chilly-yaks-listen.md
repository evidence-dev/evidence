---
'@evidence-dev/tailwind': patch
---

[!] BREAKING CHANGE:
Custom theme colors are converted implicitly to kebab-case by tailwindcss

This means that some color defined in `evidence.config.yaml` as `myCustomColor`
should be used as (for example) `text-my-custom-color`. (`text-myCustomColor` will not work)

When referencing custom theme colors in Javascript the original case should still be used
(for example) `myCustomColor` would still be `<BarChart ... fillColor=myCustomColor />`
_NOT_ `<BarChart ... fillColor="my-custom-color" />`
