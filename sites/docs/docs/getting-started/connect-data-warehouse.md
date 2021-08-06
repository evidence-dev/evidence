---
sidebar_position: 5
---

# Connect Data Warehouse

Evidence supports Google BigQuery and Snowflake. Both data warehouses offer a large collection of public datasets, which are great for testing out Evidence.

:::tip Don't have a data warehouse account?
Set up a FREE BigQuery sandbox in less than 60 seconds:<br/> 

1. [Go to BigQuery](https://console.cloud.google.com/bigquery?_ga=2.235574280.867747861.1622513856-469265758.1621868166&_gac=1.226175592.1622124503.CjwKCAjw47eFBhA9EiwAy8kzNKaExCvM0G229wH0PGh4USFcdB7wudKCKWt4MSEPM6wbQKCwOot1NxoCtxIQAvD_BwE)
2. Log in with your Google account (or create one)
3. Accept the terms of service
4. Create a project
5. [Click here to see BigQuery's public datasets](https://console.cloud.google.com/bigquery?project=bigquery-public-data&page=project)
:::

## BigQuery

### Create a Service Account Key
1. [Go to the Service Account Page](https://console.cloud.google.com/projectselector/iam-admin/serviceaccounts/create?supportedpurview=project&_ga=2.202527640.867747861.1622513856-469265758.1621868166&_gac=1.81391205.1622124503.CjwKCAjw47eFBhA9EiwAy8kzNKaExCvM0G229wH0PGh4USFcdB7wudKCKWt4MSEPM6wbQKCwOot1NxoCtxIQAvD_BwE) and click on your project
2. Add a name for your service account, then click Create
3. Assign your service account a role of **BigQuery User** (scroll down the role dropdown to find BigQuery roles)
4. Click Continue, then click Done. You should see a table of users.
5. Click on the email address for the service account you just created, then click the **Keys** tab
6. Click Add Key, then Create New Key, then Create
7. Google will download a JSON Key File to your computer

:::note Warning
Your service account will need a BigQuery role to access the public datasets because they are technically in a separate project from your own project. Make sure you set the role of your service account to **BigQuery User**
:::

### Add JSON Key File into Evidence Project
Add the JSON file you downloaded from Google to the `.evidence` folder in your project

:::note Warning for VSCode Users
VSCode combines empty directories in a way that makes it confusing to tell which directory your file is in. Select the right directory by dragging your file directly overtop of `.evidence`

![dbdirectory](/img/dbdirectory.png)

Once files are added to these directories, VSCode will split them up to show where the files are stored:

![dbdirectory_expanded](/img/dbdirectory_expanded.png)
:::

### Update Database Configuration File
![db-config](/img/dbconfig.png)
1. Open `database.config.json`
2. Replace "YOUR-JSON-KEY.json" with the name of the file you placed in the `.evidence` directory
3. Replace "YOUR-PROJECT-ID" with your project ID supplied by Google (which can be found in your JSON Key file)

### Update Evidence Configuration File
1. Open `evidence.config.json`
2. Input your data warehouse name ("bigquery"):
```json
"database":"bigquery"
```

## Snowflake
Snowflake only requires an account, username, and password to connect through Evidence.

### Update Database Configuration File
1. Open `database.config.json`
2. Input your credentials:
```json
"account": "xx16244.us-central1.gcp",
"username": "NAME",
"password": "xxxxxx"
```

### Update Evidence Configuration File
1. Open `evidence.config.json`
2. Input your data warehouse name ("snowflake"):
```json
"database":"snowflake"
```

## Next Steps
That's it - now you're ready to start querying some real datasets in Evidence!