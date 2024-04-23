```user_info
SELECT * FROM users WHERE Id = ${params.user_id}
```

# User information for user {params.user_id}

<BigValue data={user_info} value="Views" />
<BigValue data={user_info} value="UpVotes" />

## Post views by month

```user_activity
SELECT
	datetrunc('month', CreationDate) AS month, SUM(ViewCount)::INTEGER AS views
FROM posts
WHERE OwnerUserId = ${params.user_id}
GROUP BY month
HAVING views IS NOT NULL
```

<LineChart data={user_activity} x="month" y="views" />

## Monthly votes

```user_votes
SELECT
	datetrunc('month', votes.CreationDate) AS month, COUNT(votes.Id)::INTEGER AS votes
FROM votes JOIN posts
ON votes.PostId = posts.Id
WHERE posts.OwnerUserId = ${params.user_id}
GROUP BY month
```

<BarChart data={user_votes} x="month" y="votes" />

## Most popular posts

```user_posts
SELECT
	Id, Title, CreationDate as Creation_Date, Score, ViewCount as View_Count
FROM posts
WHERE OwnerUserId = ${params.user_id}
ORDER BY View_Count DESC
```

<DataTable data={user_posts}>
	<Column id="Id" />
	<Column id="Title" />
	<Column id="Creation_Date" />
	<Column id="Score" />
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
WHERE VoteTypeId = ${inputs.vote_kind.value} AND Title IS NOT NULL AND OwnerUserId = ${params.user_id}
GROUP BY Title, posts.Id
ORDER BY votes DESC
```

### Posts with the most {String(inputs.vote_kind.label).toLowerCase()}

<DataTable data={posts_by_vote_kind}>
	<Column id="Title" />
	<Column id="votes" />
</DataTable>
