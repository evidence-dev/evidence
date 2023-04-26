const missingFrontmatter = `
# Header!
`;

const emptyFrontmatter = `
---
---

# Header!
`;

const basicFrontmatter = `
---
title: Hi!

---

# Header!
`;

const complexFrontmatter = `
---
title: Hello!
multiline: |
    This
    is
    multiline
array:
  - 1
  - 2
  - "three"
  - nested: object
object:
    some: key
    nested:
        some: key
---
`;

const extraFrontmatter = `
---
title: This is the correct frontmatter
---
---
title: This is the wrong frontmatter
---

`;

const frontmatterWithMarkdownTable = `
---
title: Hello!
---
| Column One | Column Two | Column Three |
|:-----:|:-----:|:-------:|
| 100 | 100 | 1,004 |
| 2134 | 140 | 1,130 |
`;

const markdownTableWithoutFrontmatter = `
| Column One | Column Two | Column Three |
|:-----:|:-----:|:-------:|
| 100 | 100 | 1,004 |
| 2134 | 140 | 1,130 |
`;

const frontmatterWithTitle = `
---
title: Hello!
---
And some content
`;

const frontmatterWithTitleHidden = `
---
title: Hello!
hide_title: true
---
And some content
`;

module.exports = {
	emptyFrontmatter,
	basicFrontmatter,
	complexFrontmatter,
	extraFrontmatter,
	missingFrontmatter,
	markdownTableWithoutFrontmatter,
	frontmatterWithMarkdownTable,
	frontmatterWithTitle,
	frontmatterWithTitleHidden
};
