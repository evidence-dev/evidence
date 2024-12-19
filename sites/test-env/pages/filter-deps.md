```user_tags
SELECT COUNT(DISTINCT p.id) as postCount, u.id as userId, u.user_name, h.tag, h.id as tagId FROM post_tags pt
    INNER JOIN posts p on p.id      = pt.post_id
    INNER JOIN users u on u.id      = p.user_id 
    INNER JOIN hashtags h on h.id   = pt.hashtag_id
GROUP BY ALL
ORDER BY userId, tagId
```

<Dropdown   data={user_tags} 
            value="userId" label="user_name" 
            title="User" name="user" 
            where="tagId = {inputs.tag.value} OR {inputs.tag.value} < 0">
    <DropdownOption value={-1} valueLabel="All Users" />
</Dropdown>

<Dropdown   data={user_tags} 
            value="tagId" label="tag"
            title="Tag" name="tag"
            where="userId = {inputs.user.value} OR {inputs.user.value} < 0">
    <DropdownOption value={-1} valueLabel="All Hashtags" />
</Dropdown>

```posts
SELECT p.* FROM posts p
WHERE p.user_id = ${inputs.user.value}
  AND ${inputs.tag.value} IN (SELECT pt.hashtag_id FROM post_tags pt where pt.post_id = p.id)
  AND ${inputs.user.value} >= 0 AND ${inputs.tag.value} >= 0
```

<DataTable data={posts} emptySet="warn"/>