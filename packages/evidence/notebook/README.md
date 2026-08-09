# Native Jupyter notebook pages

A `.ipynb` file under `pages/` is a page. `pages/analysis/churn.ipynb` serves at
`/analysis/churn`, hot-reloads on save, and gets routing, SQL, components,
themes, prerendering and the production build unchanged — because it is compiled
to Evidence markdown before the existing pipeline ever sees it.

## Why here

`cli.js` already mirrors `pages/**` into the SvelteKit template, renaming
`foo.md` to `foo/+page.md`. That mirror is the one place where "a file the user
edits" becomes "a page Evidence builds", so it is the only place this needs to
hook:

```
pages/analysis/churn.ipynb
        │  runFileWatcher → syncFile
        ▼
.evidence/template/src/pages/analysis/churn/+page.md      ← ordinary Evidence markdown
.evidence/template/static/_notebook/analysis__churn/*.png ← figures, content-hashed
```

Everything downstream — `@evidence-dev/preprocess`, query extraction, mdsvex,
SvelteKit — is untouched, and a project with no notebooks behaves exactly as it
did before. Nothing else in Evidence imports this directory.

Evidence renders a notebook's **saved outputs**; it never executes a kernel.
Building a site therefore stays a pure function of the repository.

## Layout

| File | Responsibility |
|---|---|
| `index.js` | file-path rules and the write/remove entry points used by `cli.js` |
| `compile.js` | notebook → page: cell walk, frontmatter, script assembly |
| `outputs.js` | one renderer per output mimetype |
| `directives.js` | the three-level display policy (defaults → notebook → cell) |
| `serialize.js` | safe embedding of untrusted strings and data into a Svelte page |
| `python/evidence.py` | the notebook-side helper |

Dependencies: Node builtins and `fs-extra`, which `cli.js` already uses.

## The two hazards, and how they are handled

**Notebook content is machine generated and Svelte's markup parser is not safe
for it.** `{`, `}` and `</script>` all mean something. So no notebook string is
ever interpolated into markup: strings become JS literals in the page's
`<script>` (`serialize.js` escapes `<`, `>`, U+2028/9) and markup references them
by identifier. Code and stdout go into fenced blocks, whose language must be one
Evidence's highlighter recognises — an unknown language is reinterpreted as a
query reference, so plain text uses `code`, never `text`.

**Rich HTML carries its own scripts.** plotly, altair, bokeh and folium emit
`<script>` tags that `{@html}` will not execute. Those outputs go into a
same-origin `srcdoc` iframe that is measured after load, which runs them
correctly and stops their CSS leaking into the page. Script-free HTML — a pandas
repr — is injected directly.

## Notes for review

- Compilation never throws. An unparseable notebook produces a page stating why,
  so the dev server stays up and the error reaches the person editing.
- Assets are content-hashed and the notebook's asset directory is rewritten
  wholesale on each compile, so edits cannot orphan figures.
- Dataset names are checked against Evidence's injected identifiers, and a
  dataset colliding with a SQL query id on the same page is reported — that pair
  would otherwise be declared twice in one script.
- `.ipynb_checkpoints` and `*-checkpoint.ipynb` are excluded from the watcher.
