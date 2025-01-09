---
title: PostgreSQL
description: Connect Evidence to PostgreSQL
sidebar_link: false
---

Connect Evidence to PostgreSQL.

Many databases and services can be connected by using the Postgres connector, including TimescaleDB and Cube.

## SSL

To connect to a Postgres database using SSL, you may need to modify the SSL settings used. Once you have selected a PostgreSQL data connection type, you can set the SSL value as follows:
 - `false`: Don't connect using SSL (default)
 - `true`: Connect using SSL, validating the SSL certificates. Self-signed certificates will fail using this approach.
 - `no-verify`: Connect using SSL, but don't validate the certificates.

Other SSL options will require the use of a custom connection string. Evidence uses the node-postgres package to manage these connections, and the details of additional SSL options via the connection string can be found at the [package documentation](https://node-postgres.com/features/ssl).

One scenario might be a Postgres platform that issues a self-signed certificate for the database connection, but provides a CA certificate to validate that self-signed certificate. In this scenario you could use a CONNECTION STRING value as follows: 

```markdown
postgresql://{user}:{password}@{host}:{port}/{database}?sslmode=require&sslrootcert=/path/to/file/ca-certificate.crt
```

Replace the various `{properties}` as needed, and replace `/path/to/file/ca-certificate.crt` with the path and filename of your certificate.

Currently the UI does not support adding ssl with client certificates as authentication method. If you want to use this, you need to manually change your connection.yaml to:

```yaml
name: mydatabase
type: postgres
options:
  host: example.myhost.com
  port: 5432
  database: mydatabase
  ssl:
    sslmode: require
```

and your connection.options.yaml to:

```yaml
user: "USERNAME_AS_BASE64"
ssl:
  rejectUnauthorized: true
  key: "USER_KEY_AS_BASE64"
  cert: "USER_CERT_AS_BASE64"

```

Here you encode the full user key and cert file as base64 and put them in the correct options. If you do not want to verify the server certificate, for example because you have a self signed certificate, then change rejectUnauthorized to false.


# Cube

Cube offers semantic layer for your data. You can connect using the [Cube SQL API](https://cube.dev/docs/product/apis-integrations/sql-api). 

Cube's API is PostgreSQL compatible, so you can use the Evidence PostgreSQL connector to connect to Cube.

You can find the credentials to connect to Cube on the BI Integrations page under the SQL API Connection tab (you may need to enable the SQL API first).