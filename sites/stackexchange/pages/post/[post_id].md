```post_info
SELECT * FROM posts WHERE Id = ${params.post_id}
```

The post with ID {post_info[0].Id} was created on {post_info[0].CreationDate} by user {post_info[0].OwnerUserId}. It has {post_info[0].ViewCount} views and {post_info[0].Score} score. The post is titled "{post_info[0].Title}" and has the following body:

{@html post_info[0].Body}

```comments
SELECT *, '/user/' || UserId as url FROM comments WHERE PostId = ${params.post_id}
```

This post has {comments.length} comments. Here are the first {Math.min(5, comments.length)}:

<DataTable data={comments}>
	<Column id="Id" />
	<Column id="CreationDate" />
	<Column id="UserId" />
	<Column id="Text" />
	<Column id="url" contentType="link" />
</DataTable>
