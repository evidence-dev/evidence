---
sidebar_position: 2
title: Connect A Database
---

To connect your local development environment to a database: 

1. Run your evidence project with `npm run dev` 
1. Navigate to [localhost:3000/settings](http://localhost:3000/settings)
1. Select your database and enter your credentials 

## Supported Databases

Evidence supports the following databases: 

1. BigQuery 
1. Snowflake 
1. PostgreSQL 
1. MySQL 
1. SQLite

We're adding new connectors regularly. Feel free to [create a GitHub issue](https://github.com/evidence-dev/evidence/issues) or [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q) if you'd like to use Evidence with a database that isn't currently supported.

## BigQuery

### Create a Service Account Key
1. [Go to the Service Account Page](https://console.cloud.google.com/projectselector/iam-admin/serviceaccounts/create?supportedpurview=project&_ga=2.202527640.867747861.1622513856-469265758.1621868166&_gac=1.81391205.1622124503.CjwKCAjw47eFBhA9EiwAy8kzNKaExCvM0G229wH0PGh4USFcdB7wudKCKWt4MSEPM6wbQKCwOot1NxoCtxIQAvD_BwE) and click on your project
2. Add a name for your service account, then click Create
3. Assign your service account a role for BigQuery (scroll down the role dropdown to find BigQuery roles). **BigQuery User** should work, but it may depend on your organization's permissions settings in Google Cloud. If you run into trouble with permissions, you may need to change this role. Reach out to us if you run into issues or need help with BigQuery permissions.
4. Click Continue, then click Done. You should see a table of users.
5. Click on the email address for the service account you just created, then click the **Keys** tab
6. Click Add Key, then Create New Key, then Create
7. Google will download a JSON Key File to your computer

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
1. Open `database.config.json` in `.evidence` folder in your project
2. Replace "YOUR-JSON-KEY.json" with the name of the file you placed in the `.evidence` directory
3. Replace "YOUR-PROJECT-ID" with your project ID supplied by Google (which can be found in your JSON Key file)

### Update Evidence Configuration File
1. Open `evidence.config.json` in root of your project
2. Input your data warehouse name ("bigquery"):
```json
{
    "database":"bigquery"
}
```

## Snowflake
Snowflake only requires an account, username, and password to connect through Evidence.

### Update Database Configuration File
1. Open `database.config.json` in `.evidence` folder in your project
2. Input your credentials:
```json
{
    "account": "xx16244.us-central1.gcp",
    "username": "NAME",
    "password": "xxxxxx"
}
```


### Update Evidence Configuration File
1. Open `evidence.config.json` in root of your project.
2. Input your data warehouse name ("snowflake"):
```json
{
    "database":"snowflake"
}
```

## Postgres
Postgres can be connected with basic database credentials. If you run into issues or need another type of auth to connect to your Postgres database, please [create a GitHub issue](https://github.com/evidence-dev/evidence/issues), [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q), or send an email to <support@evidence.dev>.

### Update Database Configuration File
1. Open `database.config.json` in `.evidence` folder in your project
2. Input your credentials:
```json
{
    "host": "database.server.com",
    "database": "my-database-name",
    "port": 5432,
    "user": "postgres",
    "password": "xxxxxx"
}
```
3. [Optional] If your database requires SSL, you can add this option to the config options above:
```json
"ssl": true
```
By default, `ssl` will be set to false.

**Note for Heroku Postgres users:** You may need to supply a different SSL argument. The below will work, but may not provide the right level of security for your project. We will be updating thse docs with more resources for Heroku Postgres databases in the near future. Please reach out on Slack or create a Github issue if you would like to contribute to these docs.
```json
"ssl": "no-verify"
```

### Update Evidence Configuration File
1. Open `evidence.config.json` in root of your project.
2. Input your database name ("postgres"):
```json
{
    "database":"postgres"
}
```


## MySQL
MySQL can be connected with basic database credentials. If you run into issues or need another type of auth to connect to your MySQL database, please [create a GitHub issue](https://github.com/evidence-dev/evidence/issues), [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q), or send an email to <support@evidence.dev>.

### Update Database Configuration File
1. Open `database.config.json` in `.evidence` folder in your project
2. Input your credentials:

**Basic Credentials**
```json
{
    "host": "database.server.com",
    "database": "my-database-name",
    "port": 5432,
    "user": "username",
    "password": "xxxxxx"
}
```

**Google Cloud SQL**   

If you are using Google Cloud SQL, you can also connect using a socket path and the config options below.

`socketPath` is a concatenation of "/cloudsql/" and your instance's **connection name** which you can find in Google Cloud.

```json
{
    "socketPath": "/cloudsql/my-project-123:us-northeast2:my-instance"
    "database": "database_name"
    "user": "username"
    "password": "xxxxxx"
}
```

### Update Evidence Configuration File
1. Open `evidence.config.json` in root of your project.
2. Input your database name ("mysql"):
```json
{
    "database":"mysql"
}
```

## SQLite

### Update Database Configuration File
1. Open `database.config.json` in `.evidence` folder in your project
2. Input your SQLite filename:
```json
{
    "filename": "/Users/myname/myfolder/mydb.sqlite3"
}
```


### Update Evidence Configuration File
1. Open `evidence.config.json` in root of your project.
2. Input your database name ("sqlite"):
```json
{
    "database":"sqlite"
}
```


## Next Steps
That's it - now you're ready to start querying some real datasets in Evidence!
