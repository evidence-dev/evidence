# Info on apple.stackexchange.com

<DateRange data="posts" dates="CreationDate" name="post_range" />

## Count of posts by month

```posts_by_month
SELECT
	datetrunc('month', CreationDate) AS month, COUNT(*)::INTEGER AS posts
FROM posts
GROUP BY month
ORDER BY month
```

<LineChart data={posts_by_month} x="month" y="posts" />

## Most active users

```most_active_users
SELECT
	DisplayName as Display_Name, COUNT(*)::INTEGER AS posts, '/user/' || users.Id::INTEGER as url
FROM posts JOIN users
ON posts.OwnerUserId = users.Id
GROUP BY Display_Name, users.Id
ORDER BY posts DESC
LIMIT 100
```

<DataTable data={most_active_users} link="url">
	<Column id="Display_Name" />
	<Column id="posts" />
</DataTable>

## Most viewed posts

```most_viewed_posts
SELECT
	Id, Title, ViewCount as View_Count
FROM posts
ORDER BY View_Count DESC
LIMIT 100
```

<DataTable data={most_viewed_posts}>
	<Column id="Id" />
	<Column id="Title" />
	<Column id="View_Count" />
</DataTable>

## Highest voted posts

<Dropdown title="Select vote type" name="vote_kind">
	<DropdownOption valueLabel="Upvotes" value={2} />
	<DropdownOption valueLabel="Downvotes" value={3} />
</Dropdown>

```posts_by_vote_kind
SELECT
	Title, COUNT(*)::INTEGER AS votes
FROM posts JOIN votes
ON posts.Id = votes.PostId
WHERE VoteTypeId = 2
  AND Title IS NOT NULL 
GROUP BY Title, posts.Id
ORDER BY votes DESC
LIMIT 100
```

### Posts with the most {inputs.vote_kind.label.toString().toLowerCase()}

<DataTable data={posts_by_vote_kind}>
	<Column id="Title" />
	<Column id="votes" />
</DataTable>
