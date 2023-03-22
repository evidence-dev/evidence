---
title: A page title
description: Here is a detailed description of the page that is typically up to 160 characters
og:
    title: Title for social
    description: Description for social
    image: img_for_social.png
---

If you send somebody a link to this page; it should show something different from other pages

Frontmatter is surrounded with a "fence" (`---`), and the content looks like this:

<pre>
title: A page title
description: Here is a detailed description of the page that is typically up to 160 characters
og:
    title: Title for social
    description: Description for social
    image: img_for_social.png
</pre>

You can put whatever data you would like here, and it uses a [yaml syntax](https://yaml.org/), but the data listed above is special.

`title` changes the name of the tab
`description` is used for search engines

`og` changes how your link shows up when shared on things like Slack, Facebook, Twitter, Discord, etc
`og.title` changes the title that appears in the embed; if this is not specified, but `title` is, then `title` is used (and vise versa)
`og.description` changes the body of the embed
`og.image` will appear in the embed if specified, but it is not required.