---
title: Microsoft SQL Server
description: Connect Evidence to Microsoft SQL Server
sidebar_link: false
---

Connect Evidence to Microsoft SQL Server.

## Trust Server Certificate

The `trustServerCertificate` option indicates whether the channel will be encrypted while bypassing walking the certificate chain to validate trust. This option is disabled by default.

## Encrypt

The `encrypt` option indicates whether SQL Server uses SSL encryption for all data sent between the client and server if the server has a certificate installed. Necessary for Azure databases.

## Connection Timeout

The `connection_timeout` option indicates the connection timeout limit, in milliseconds. It defaults to 15000 ms.

## Request Timeout

The `request_timeout` option indicates the time, in milliseconds, that a query can run before it is terminated. It defaults to 15000 ms.

