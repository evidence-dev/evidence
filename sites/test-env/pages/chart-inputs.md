```sql post_metrics
SELECT COUNT(distinct posts.id) as "Post Count", COUNT(distinct posts.user_id) as "Author Count", tag as hashtag
FROM posts
		INNER JOIN post_tags pt ON pt.post_id = posts.id
		INNER JOIN hashtags h ON h.id = pt.hashtag_id
GROUP BY ALL
```


<BarChart name="tag" toggle x="hashtag" y="Post Count" data={post_metrics} />


{inputs.tag}

```sql post_details
SELECT 
    tag, 
    gender, 
    COUNT(distinct p.id) as "Post Count", 
    COUNT(distinct u.id) as "Author Count"
FROM hashtags h
    INNER JOIN post_tags pt ON pt.hashtag_id = h.id
    INNER JOIN posts p ON p.id = pt.post_id
    INNER JOIN users u ON u.id = p.user_id
WHERE ${inputs.tag}
GROUP BY ALL
```


<pre class='text-xs'>{post_details.originalText}</pre>

## {inputs.tag.label.toString() || 'All'} Post and Authors by Gender
<DataTable data={post_details} />