---
    hide_table_of_contents: false
    title: Github Pages
---

:::caution
Deploying to Github pages requires some javascript, unlike alternatives such as [Evidence Cloud](/deployment/evidence-cloud) [Netlify](/deployment/netlify) or [Vercel](/deployment/vercel), if you are unsure, consider using another method.
:::

## Deploying to Github Pages

Deploying to Github Pages requires a few additional steps and considerations compared to other providers. This is because most providers deploy your app to a link such as `https://your.project.com`, but Github Pages deploys to a
link such as `https://you.github.io/project`. Your project needs to be built with that in mind, otherwise navigation
in your application will perform in unexpected ways.

First, [configure githug pages for your repository](https://docs.github.com/en/pages/quickstart).

Once Github pages has been set up; build your project with the environment variable `EVIDENCE_BASE_PATH` set to your repositories name; note that it must start, but not end, with a `/`. This will configure evidence to point built-in links to `/your-base-path` instead of `/`. (`EVIDENCE_BASE_PATH={your repository} npm run build`)

Finally, whenever you create a link to a page in your project (e.g. one that starts with `/`), you must prefix it with `{base}`. This will ensure that the link functions properly when deployed to Github pages.

### Example Link

```md
[Some Page]({base}/some-page)
```
