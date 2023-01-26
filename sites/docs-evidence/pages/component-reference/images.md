---
sidebar_position: 3
title: Adding Images & Static Files
---

# Images

Images, gifs, and other static files can be included in your project. 

Add images using standard markdown syntax:

```markdown
![Image description](my-image.png)
```

## Storing Static Files and Images

Evidence looks for images in the `/static` in the root of your project, so save any image files there (or you can organize them into subfolders).

```shell
+-- pages/
|   `-- index.md
`-- static/
    `-- my-image.png
```