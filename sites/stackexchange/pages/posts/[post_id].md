```comments
SELECT Id, CreationDate as Creation_Date, Text, UserId as User_Id, '/user/' || UserId as url
FROM comments
WHERE PostId = ${params.post_id}
ORDER BY Creation_Date DESC
```

This post has {comments.length} comments. Here are the first {Math.min(5, comments.length)}:

<DataTable data={comments} link="url">
	<Column id="Id" />
	<Column id="Creation_Date" />
	<Column id="User_Id" />
	<Column id="Text" />
</DataTable>
