<script>
    let currentTag;
</script>

# Not Twitter Trending Hashtags

```most_posted_tags
WITH EVERYTHING AS (
    SELECT
        COUNT(*) as post_count,
        DATE_TRUNC('day', p.created_at) as w,
        h.tag,
        h.id as hashtag_id
    FROM hashtags h
        INNER JOIN post_tags pt on h.id = pt.hashtag_id
        INNER JOIN posts p on pt.post_id = p.id

    WHERE w > (CURRENT_DATE - INTERVAL '5 WEEK')
    GROUP BY DATE_TRUNC('day', p.created_at), h.tag, h.id
    ORDER BY 2, 1 desc
)
    SELECT * FROM EVERYTHING
    GROUP BY ALL
    HAVING tag IN (
        SELECT tag FROM EVERYTHING GROUP BY ALL ORDER BY SUM(post_count) DESC LIMIT 5
    )
```

```most_liked_tags
WITH EVERYTHING AS (
    SELECT  COUNT(l.id) as likes,
            h.tag,
            date_trunc('day', p.created_at) as w,
            h.id as hashtag_id
        FROM likes l
            INNER JOIN posts p on l.post_id = p.id
            INNER JOIN post_tags pt ON p.id = pt.post_id
            INNER JOIN hashtags h ON pt.hashtag_id = h.id
        WHERE p.created_at > (CURRENT_DATE - INTERVAL '5 WEEKS')
        GROUP BY h.tag, date_trunc('day', p.created_at), h.id
        ORDER BY 1 DESC
)
SELECT * FROM EVERYTHING
GROUP BY ALL
HAVING tag IN (
    SELECT tag FROM EVERYTHING GROUP BY ALL ORDER BY SUM(likes) DESC LIMIT 5
)
```

```liked_and_posted_tags
WITH A AS (
    SELECT * FROM ${most_liked_tags}
), B AS ( SELECT * FROM ${most_posted_tags} )
SELECT DISTINCT tag, hashtag_id FROM ( SELECT * FROM A UNION SELECT * FROM B )
    WHERE tag in (SELECT tag FROM A) AND tag in (SELECT tag FROM B)
```

```total_posts
SELECT COUNT(*) as postCount FROM posts p
    INNER JOIN post_tags pt on p.id = pt.post_id
WHERE p.created_at > CURRENT_DATE - INTERVAL '5 WEEK' AND pt.hashtag_id = ${currentTag?.hashtag_id ?? -1}
GROUP BY pt.hashtag_id
```

```unique_post_authors
SELECT COUNT(DISTINCT u.ID) as authorCount
FROM users u
    INNER JOIN posts p ON p.user_id = u.id
    INNER JOIN post_tags pt ON pt.post_id = p.id
WHERE pt.hashtag_id = ${currentTag?.hashtag_id ?? -1} AND p.created_at > CURRENT_DATE - INTERVAL '5 WEEK'
GROUP BY pt.hashtag_id
```

```unique_post_likers
SELECT COUNT(DISTINCT u.ID) as authorCount
FROM users u
    INNER JOIN likes l ON l.user_id = u.id
    INNER JOIN post_tags pt ON pt.post_id = l.post_id
    INNER JOIN posts p ON pt.post_id = p.id
WHERE pt.hashtag_id = ${currentTag?.hashtag_id ?? -1} AND p.created_at > CURRENT_DATE - INTERVAL '5 WEEK'
GROUP BY pt.hashtag_id
```

## Most popular hashtags over the last month

### Based on occurance in posts

<LineChart
data={most_posted_tags}
y="post_count"
yAxisTitle="Tagged Posts"
xAxisTitle="Date"
series="tag"
handleMissing="connect"
x="w"
/>

### Based on total number of likes

<LineChart
data={most_liked_tags}
y="likes"
yAxisTitle="Likes Accumulated"
xAxisTitle="Date"
series="tag"
handleMissing="connect"
x="w"
/>

### Tags that appear in both:

<ul>
    {#each liked_and_posted_tags as t}
        <li>{t.tag}</li>
    {/each}
</ul>

<label>
    Inspect a tag
    <select bind:value={currentTag} class="bg-gray-100 block">
        {#each liked_and_posted_tags as h}
            <option value={h}>{h.tag}</option>
        {/each}
    </select>
</label>

{#if currentTag}
<BigValue data={total_posts} value="postCount" title="Posts with #{currentTag?.tag}"/>
<BigValue data={unique_post_authors} value="authorCount" title="Unique authors posting about #{currentTag?.tag}"/>
<BigValue data={unique_post_likers} value="authorCount" title="Unique users liking posts about #{currentTag?.tag}"/>
{/if}
