---
title: Trino
description: Connect Evidence to Trino
sidebar_link: false
---

Connect Evidence to Trino.

## Supported Authentication Types

While Trino supports multiple [authentication types](https://trino.io/docs/current/security/authentication-types.html), the connector does currently only support the password based ones. Behind the scenes, the connector is using [Basic access authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) for communicating with Trino.

## HTTPS

To connect to a Trino installation that is accessible via HTTPS, you need to set the SSL option to `true` and the port to `443`/`8443` (unless you are using a non standard port for HTTPS, in which case you should use that instead).

## Starburst Quickstart

[Starburst](https://www.starburst.io), the company behind Trino, offers a SAAS solution where they run Trino for you. Once you have signed up and created a Trino cluster, you should be able to connect Evidence with the following configuration:

Host: `<YOUR_DOMAIN>-<YOUR_CLUSTER_NAME>.galaxy.starburst.io`

Port: `443`

User: `<YOUR_EMAIL>/accountadmin`

SSL: `true`

Password: The password you use to login to your Starburst account

Alternatively, you can also create a service account at `https://<YOUR_DOMAIN>.galaxy.starburst.io/service-accounts` and use this to connect.

