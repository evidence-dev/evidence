const missingFrontmatter = `
# Header!
`

const emptyFrontmatter = `
---
---

# Header!
`

const basicFrontmatter = `
---
title: Hi!

---

# Header!
`

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
`

const extraFrontmatter = `
---
title: This is the correct frontmatter
---
---
title: This is the wrong frontmatter
---

`

module.exports = {
    emptyFrontmatter,
    basicFrontmatter,
    complexFrontmatter,
    extraFrontmatter,
    missingFrontmatter
}