# Flicker Reproduction

```sql hashtags
SELECT *
FROM hashtags
```

<Dropdown name="selected_tag" data={hashtags} label=tag value=id />

<BigValue data={hashtags} value="tag" />
<DataTable data={hashtags}/>

```sql hashtag
SELECT *
FROM hashtags
WHERE id = ${inputs.selected_tag.value}
```

<BigValue data={hashtag} value="tag" />
<DataTable data={hashtag}/>

