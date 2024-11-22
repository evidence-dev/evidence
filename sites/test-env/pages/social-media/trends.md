<script>
    let currentTag;
</script>

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

    WHERE w > (CURRENT_DATE - INTERVAL ${inputs.time_range.value})
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
        WHERE p.created_at > (CURRENT_DATE - INTERVAL ${inputs.time_range.value})
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
-- total_posts
SELECT COUNT(*) as postCount FROM posts p
    INNER JOIN post_tags pt on p.id = pt.post_id
WHERE p.created_at > CURRENT_DATE - INTERVAL ${inputs.time_range.value} AND pt.hashtag_id = ${inputs.selected_tag.value}
GROUP BY pt.hashtag_id
```

```unique_post_authors
SELECT COUNT(DISTINCT u.ID) as authorCount
FROM users u
    INNER JOIN posts p ON p.user_id = u.id
    INNER JOIN post_tags pt ON pt.post_id = p.id
WHERE pt.hashtag_id = ${inputs.selected_tag.value} AND p.created_at > CURRENT_DATE - INTERVAL ${inputs.time_range.value}
GROUP BY pt.hashtag_id
```

```unique_post_likers
SELECT COUNT(DISTINCT u.ID) as authorCount
FROM users u
    INNER JOIN likes l ON l.user_id = u.id
    INNER JOIN post_tags pt ON pt.post_id = l.post_id
    INNER JOIN posts p ON pt.post_id = p.id
WHERE pt.hashtag_id = ${inputs.selected_tag.value} AND p.created_at > CURRENT_DATE - INTERVAL ${inputs.time_range.value}
GROUP BY pt.hashtag_id
```

# Not Twitter Trending Hashtags

<div class="flex gap-4" >
    <Dropdown data={liked_and_posted_tags} value="hashtag_id" label="tag" name=selected_tag />
    <Dropdown name="time_range" title="Time Range" defaultValue="1 YEAR">
        <DropdownOption value="5 WEEK" valueLabel="Month" />
        <DropdownOption value="13 WEEK" valueLabel="Quarter" />
        <DropdownOption value="1 YEAR" valueLabel="Year" />
    </Dropdown>
</div>


These values all flicker because they are dependent on an input

{#if inputs.selected_tag.value}
<div class="grid grid-cols-3">
    <BigValue data={total_posts} value="postCount" title="Posts with {inputs.selected_tag.label}"/>
    <BigValue data={unique_post_authors} value="authorCount" title="Unique authors posting about {inputs.selected_tag.label}"/>
    <BigValue data={unique_post_likers} value="authorCount" title="Unique users liking posts about {inputs.selected_tag.label}"/>
</div>
<div class="grid grid-cols-3">
    <Value data={total_posts} value="postCount" title="Posts with {inputs.selected_tag.label}"/>
    <Value data={unique_post_authors} value="authorCount" title="Unique authors posting about {inputs.selected_tag.label}"/>
    <Value data={unique_post_likers} value="authorCount" title="Unique users liking posts about {inputs.selected_tag.label}"/>
</div>
{/if}

---
These shouldn't flicker

<BigValue data={most_liked_tags} value="tag" title="Most liked tag"/>
<BigValue data={most_posted_tags} value="tag" title="Most posted tag"/>

## Most popular hashtags over the last {inputs.time_range.label}

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

<BarChart
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
>

<ReferenceArea xMin='2023-12-1' xMax='2023-12-5' label='Ref Area' color=negative />
<ReferenceLine x='2023-12-10' label='Ref Lin' color=negative />

</LineChart>

### Tags that appear in both:

<ul>
    {#each liked_and_posted_tags as t}
        <li>{t.tag}</li>
    {/each}
</ul>

<!-- <label>
    Inspect a tag
    <select bind:value={currentTag} class="bg-gray-100 block">
        {#each liked_and_posted_tags as h}
            <option value={h}>{h.tag}</option>
        {/each}
    </select>
</label> -->
