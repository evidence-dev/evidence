```user_info
SELECT * FROM users WHERE Id = ${params.user_id}
```

User {user_info[0].DisplayName} has had their posts viewed {user_info[0].Views} times, with {user_info[0].UpVotes} upvotes in that time.

Their about-me section reads:

{@html user_info[0].AboutMe}

```user_activity
SELECT
	time_bucket(INTERVAL '1 months', CreationDate) AS month, SUM(ViewCount)::INTEGER AS views
FROM posts
WHERE OwnerUserId = ${params.user_id}
GROUP BY month
```

Here is a chart of the views on their posts by month:

<LineChart data={user_activity} x="month" y="views" />

```user_posts
SELECT
	Id, Title, CreationDate, Score, ViewCount, '/post/' || Id::INTEGER as url
FROM posts
WHERE OwnerUserId = ${params.user_id}
ORDER BY CreationDate DESC
```

Here are their most recent posts:

<DataTable data={user_posts}>
	<Column id="Id" />
	<Column id="Title" />
	<Column id="CreationDate" />
	<Column id="Score" />
	<Column id="ViewCount" />
	<Column id="url" contentType="link" />
</DataTable>

```user_comments
SELECT
	Id, CreationDate, PostId, Text, '/post/' || PostId::INTEGER as url
FROM comments
WHERE UserId = ${params.user_id}
ORDER BY CreationDate DESC
```

Here are their most recent comments:

<DataTable data={user_comments}>
	<Column id="Id" />
	<Column id="CreationDate" />
	<Column id="PostId" />
	<Column id="Text" />
	<Column id="url" contentType="link" />
</DataTable>
