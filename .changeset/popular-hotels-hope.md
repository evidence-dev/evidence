---
'@evidence-dev/component-utilities': patch
'@evidence-dev/preprocess': patch
---

Remove usql context; proper approach is to use page store now. Context is not reactive; and would require a store which is the behavior already present in \$app/stores.page
