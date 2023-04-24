---
    hide_table_of_contents: false
    title: Github Pages
---

:::caution
Deploying to Github pages requires more javascript knowledge than alternatives like [Evidence Cloud](/deployment/evidence-cloud) [Netlify](/deployment/netlify) or [Vercel](/deployment/vercel), if you are unsure, consider using another method.
:::

## Deploying to Github Pages

Deploying to Github Pages requires a few additional steps and considerations compared to other providers.

First, [configure githug pages for your repository](https://docs.github.com/en/pages/quickstart).

Once Github pages has been set up; build your project with the environment variable `EVIDENCE_BASE_PATH` set to your repositories name; note that it must start, but not end, with a `/`. This will configure evidence to point built-in links to `/your-base-path` instead of `/`. (`EVIDENCE_BASE_PATH={your repository} npm run build`)

Finally, whenever you create a relative link (e.g. one that starts with `/` and navigates to a page in your evidence project), you must prefix it with `{base}`. This will ensure that the link functions properly when deployed to github pages.

### Example Link

```md
[Some Page]({base}/some-page)
```
