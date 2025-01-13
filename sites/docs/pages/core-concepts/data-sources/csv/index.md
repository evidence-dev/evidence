---
title: CSV
description: Connect Evidence to CSV
sidebar_link: false
---

CSVs are a simple file format that stores data in a human-readable, plain text format. They are widely used for data storage and transfer. Evidence supports connecting to CSV files as a data source, allowing you to query them using SQL.

<NewSource sourceName="CSV" />

Then copy any CSV files you want to query into `sources/[your_csv_source_name]/`. Your source names and csv files can only contain letters, numbers and underscores eg `/my_source/my_csv_2024.csv`

## How to Query a CSV File

Evidence looks for files with the `.csv` extension stored in a `sources/[your_csv_source_name]/` folder in the root of your Evidence project. You can query them using this syntax:

```sql
select * from your_csv_source_name.csv_file_name
```

Do **not** include the `.csv` extension in the file name when querying.

## Configuration

You can add [DuckDB source options](https://duckdb.org/docs/data/csv/overview.html) that are passed in as arguments to the `read_csv()` function. 

Ensure there are no spaces in your source options you pass, and to use double quotes when passing strings


```sql source_options
select 'header=false' as "Option String", 'Reads the first line as the first row of data' as "Outcome", 0 as row_num UNION ALL
select 'delim="|"', 'Use "|" characters as delimiters when reading the csv', 1 UNION ALL
select 'header=false,delim="|"', 'Use both of these options', 2
order by row_num
```

<DataTable data={source_options}>
    <Column id="Option String" />
    <Column id="Outcome" />
</DataTable>

