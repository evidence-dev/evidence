# Info on apple.stackexchange.com

## Count of posts by month

```posts_by_month
SELECT
	time_bucket(INTERVAL '1 months', CreationDate) AS month, COUNT(*)::INTEGER AS posts
FROM posts
GROUP BY month
ORDER BY month
```

<LineChart data={posts_by_month} x="month" y="posts" />

## Most active users

```most_active_users
SELECT
	DisplayName, COUNT(*)::INTEGER AS posts, '/user/' || users.Id::INTEGER as url
FROM posts JOIN users
ON posts.OwnerUserId = users.Id
GROUP BY DisplayName, users.Id
ORDER BY posts DESC
LIMIT 100
```

<DataTable data={most_active_users}>
	<Column id="DisplayName" />
	<Column id="posts" />
	<Column id="url" contentType="link" />
</DataTable>

## Most viewed posts

```most_viewed_posts
SELECT
	Id, Title, ViewCount, '/post/' || Id::INTEGER as url
FROM posts
ORDER BY ViewCount DESC
LIMIT 100
```

<DataTable data={most_viewed_posts}>
	<Column id="Id" />
	<Column id="Title" />
	<Column id="ViewCount" />
	<Column id="url" contentType="link" />
</DataTable>

## Highest voted posts

<Dropdown title="Select vote type" name="vote_kind" defaultValue={12}>
	<DropdownOption valueLabel="Accepted By Originator" value={1} />
	<DropdownOption valueLabel="Up Mod" value={2} />
	<DropdownOption valueLabel="Down Mod" value={3} />
	<DropdownOption valueLabel="Offensive" value={4} />
	<DropdownOption valueLabel="Favorite" value={5} />
	<DropdownOption valueLabel="Close" value={6} />
	<DropdownOption valueLabel="Reopen" value={7} />
	<DropdownOption valueLabel="Bounty Start" value={8} />
	<DropdownOption valueLabel="Bounty Close" value={9} />
	<DropdownOption valueLabel="Deletion" value={10} />
	<DropdownOption valueLabel="Undeletion" value={11} />
	<DropdownOption valueLabel="Spam" value={12} />
	<DropdownOption valueLabel="Inform Moderator" value={13} />
</Dropdown>

```posts_by_vote_kind
SELECT
	Title, COUNT(*)::INTEGER AS votes, '/post/' || posts.Id::INTEGER as url
FROM posts JOIN votes
ON posts.Id = votes.PostId
WHERE VoteTypeId = ${inputs.vote_kind.value} AND Title IS NOT NULL
GROUP BY Title, posts.Id
```

### Posts with the most {inputs.vote_kind.label} votes

<DataTable data={posts_by_vote_kind}>
	<Column id="Title" />
	<Column id="votes" />
	<Column id="url" contentType="link" />
</DataTable>
