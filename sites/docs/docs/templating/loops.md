---
sidebar_position: 3
hide_table_of_contents: false
---

# Loops

```markdown title="Displaying text from a loop"
{#each data.query_name as alias}

{alias.column_a}

{/each}
```

```markdown title="Displaying values from a loop"
{#each data.query_name as alias}

<Value value={alias.column_b}/>

{/each}
```