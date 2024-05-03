# Text Input


## Text Input
<TextInput name=search_input/>

Input: {inputs.search_input}

## Text Input with Title

<TextInput name=another_search_input title="Search"/>

Input: {inputs.another_search_input}

## Text Input with Custom Placeholder

<TextInput name=another_search title="Freetext Search" placeholder="Start typing"/>

Input: {inputs.another_search}

## Text Input with Default Value

<TextInput name=yet_another_search title="Default Selected" defaultValue="Sporting"/>

Input: {inputs.yet_another_search}


Search Value: {inputs.yet_another_search.search('column_name')}

<!-- TODO: Fix this which breaks when you pass input into a query

## Filter a query with a text input


```sql just_the_named_categories
SELECT * FROM orders 
WHERE category LIKE '%${inputs.search_input}'
```

<DataTable data={just_the_named_categories}/>
 -->
