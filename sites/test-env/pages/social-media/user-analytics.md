# Not Twitter User Analytics

```total_users
SELECT COUNT(*) as userCount FROM users
```

```users_by_month
WITH raw as (
    SELECT
        COUNT(*) as userCount,
        DATE_TRUNC('month', created_at) m
    FROM users
    GROUP BY 2
    ORDER BY 2 desc
)
SELECT userCount, userCount - LAG(userCount, -1) OVER (order by m desc) as delta, m from raw
```

```users
SELECT * FROM users
```

<DataTable data={users} rows=6 />

```users_by_gender
SELECT COUNT(*) userCount, gender FROM users group by 2 order by 2 asc
```

```avg_user_engagement
WITH USER_METRICS AS (
    SELECT user_name,
            (SELECT COUNT(*) FROM LIKES L WHERE L.user_id = U.id) as user_likes,
            (SELECT COUNT(*) FROM COMMENTS C WHERE C.user_id = U.id) as user_comments,
            (SELECT COUNT(*) FROM POSTS P WHERE P.user_id = U.id) as user_posts,
            (
                SELECT COUNT(distinct l.id) FROM posts p
                INNER JOIN likes l on p.id = l.post_id
                WHERE p.user_id = u.id
            ) as received_likes
    from users U
)
SELECT  AVG(user_likes) as avg_likes_given,
        AVG(received_likes) as avg_likes_received,
        AVG(user_comments) as avg_comments,
        AVG(user_posts) as avg_posts
FROM USER_METRICS
```

<BigValue title="Total Users" data={total_users} value="userCount" />
<BigValue title="New Users this Month" comparisonTitle="vs Last Month" data={users_by_month} value="userCount" comparison="delta"/>

There were <Value data={total_users} value="userCount"/> users this month; with <Value data={users_by_month} value="userCount"/> new ones compared to last month.

<Chart data={users_by_month} x="m" title="New users & delta by month">
    <Line  y="userCount"/>
    <Bar  y="delta"/>
</Chart>

<BarChart
    title="Users by Gender"
    data={users_by_gender}
    y="userCount"
    x="gender"
/>

<BigValue title="Average Likes Given" data={avg_user_engagement} value="avg_likes_given" />
<BigValue title="Average Likes Received" data={avg_user_engagement} value="avg_likes_received" />
<BigValue title="Average Comments Posted" data={avg_user_engagement} value="avg_comments" />
<BigValue title="Average Posts Made" data={avg_user_engagement} value="avg_posts" />
