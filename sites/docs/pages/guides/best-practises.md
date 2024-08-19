# Best Practises

By it's nature, Evidence is a very flexible and open-ended tool, which allows you to build almost any kind of data app. However, to get the best out of Evidence, there are some principles to follow for the best results.

## Source Performance

### Only source the data you need

Every time you rebuild Evidence, it re-caches all the data from your sources. 
This can be: 
- Time-consuming and expensive to cache.
- Cause longer load times for your app, as the data comes over the network.

It's best to only source the data you need. 

**Best Practise:** Pre-aggregate data in your source queries, only select the columns and rows you need.

### Sort your source queries

The cache in Evidence is composed of parquet files. After running `npm run sources`, you can inspect these files in `.evidence/template/static/data`.

Sorted queries lead to better compression in parquet files, which means faster source build times, lower likelyhood of hitting memory limits, and faster query times in your app.

If your source queries are sorted, the client-side query engine is able to take advantage of [Projection Pushdown](https://duckdb.org/2021/06/25/querying-parquet.html#automatic-filter--projection-pushdown) i.e. only loading the rows it needs.

**Best Practise:** Sort your source queries. The best columns to sort on are those that appear in `WHERE` clauses in your markdown queries.

## Interactive Performance

### Change Props, not Components

