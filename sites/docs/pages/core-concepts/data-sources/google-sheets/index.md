---
title: Google Sheets
description: Connect Evidence to Google Sheets
sidebar_link: false
---

Google Sheets is a cloud-based spreadsheet application that allows you to store and query data using a web interface. Evidence supports connecting to Google Sheets as a data source, allowing you to query Google Sheets using SQL.

<Alert status="warning">   

**Plugin**<br/>
The Google Sheets data source is a plugin, you first need to [install the plugin](https://github.com/evidence-dev/datasources/tree/main/gsheets#adding-the-adapter-to-evidence).

</Alert>

<NewSource sourceName="Google Sheets" />

## Configuration



Adding data from Google Sheets requires a a [service account](https://cloud.google.com/iam/docs/service-accounts).

To create a service account, see the [BigQuery instructions](/core-concepts/data-sources/bigquery).

1. Create a service account, and download the JSON key file
2. Give the service account access to your Google Sheet by sharing the sheet with the service account's email address.
4. Add the JSON key file to your Evidence app via the [Settings page](http://localhost:3000/settings)
5. In the connections.yaml file, add the sheet id (which can be found in the URL of the Google Sheet, after `https://docs.google.com/spreadsheets/d/`).

```yaml
name: [your_source_name]
type: gsheets
options: {}
sheets:
   [your_workbook_name]: [your_sheet_id]
```

Query the sheet using the following syntax:

```sql
select * from [your_source_name].[your_workbook_name]_[your_tab_name]
```
  
Where `[your_tab_name]` is the name of the tab in your Google Sheet, with spaces replaced by underscores.

