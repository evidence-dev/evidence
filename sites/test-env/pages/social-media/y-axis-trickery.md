```q
SELECT count(distinct p.id) as posts, t.tag, u.gender  FROM post_tags pt
    INNER JOIN posts p on pt.post_id = p.id
    INNER JOIN hashtags t on pt.hashtag_id = t.id
    INNER JOIN users u on p.user_id = u.id
GROUP BY ALL
ORDER BY 1 desc
```

<!-- <BarChart type=stacked100 data={q} y=posts x=tag series=gender yAxisLabels={false} /> -->

<BarChart 
    data = {q}
    title = 'Posts by gender'
    subtitle = 'distinct posts by tag & gender'
    y=posts
    series=gender
    x=tag
    yMax=1
    labels=true
    stackTotalLabel=false
    yGridlines=false
    yAxisLabels=false
/>