---
title: Frontmatter in Evidence
description: Here is a detailed description of the page that is typically up to 160 characters
og:
  title: Title for social
  description: Description for social
  image: img_for_social.png
some_arbitrary_frontmatter: This is arbitrary, and can be anything
---

If you send somebody a link to this page; it should show something different from other pages

Frontmatter is surrounded with a "fence" (`---`), and the content looks like this:

```markdown
---
title: Frontmatter in Evidence
description: Here is a detailed description of the page that is typically up to 160 characters
og:
  title: Title for social
  description: Description for social
  image: img_for_social.png
---
```

You can put whatever data you would like here, and it uses a [yaml syntax](https://yaml.org/), but some properties are special:

| Property         | Effect                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `title`          | changes the name of the tab, and also adds a header to your page                                                             |
| `hide_title`     | if true, the title will not show as a header on the page                                                                     |
| `description`    | is used for search engines                                                                                                   |
| `og`             | changes how your link shows up when shared on things like Slack, Facebook, Twitter, Discord, etc                             |
| `og.title`       | changes the title that appears in the embed; if this is not specified, but `title` is, then `title` is used (and vice versa) |
| `og.description` | changes the body of the embed                                                                                                |
| `og.image`       | will appear in the embed if specified, but it is not required.                                                               |
| `sources`        | references SQL queries stored in the /sources directory.                                                                     |

You can access any of your frontmatter values by surrounding them with `{}`.
For example, this page has `some_arbitrary_frontmatter` included in it's own frontmatter, which has a value of "{some_arbitrary_frontmatter}"
