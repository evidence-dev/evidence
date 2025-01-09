---
title: Snowflake
description: Connect Evidence to Snowflake
sidebar_link: false
---

Connect Evidence to Snowflake.

Evidence supports connecting to Snowflake using a [Snowflake Account](https://docs.snowflake.com/en/user-guide/api-authentication), [Key-Pair Authentication](https://docs.snowflake.com/en/user-guide/key-pair-auth.html), [Browser-Based SSO](https://docs.snowflake.com/en/user-guide/admin-security-fed-auth-use#label-browser-based-sso), or [Native SSO through Okta](https://docs.snowflake.com/en/user-guide/admin-security-fed-auth-use#label-native-sso-okta).  All Snowflake column names will be converted to lowercase in Evidence.

## Snowflake Account
The Snowflake Account authentication method uses your Snowflake username and password to authenticate. If you don't have access to these, you will need to use one of the other authentication methods.

## Key-Pair Authentication
The Key-Pair Authentication method uses a public/private key pair to authenticate. To use this method, you will need to [generate a public/private key pair](https://docs.snowflake.com/en/user-guide/key-pair-auth.html#label-generating-a-key-pair) and upload the public key to Snowflake.

## Browser-Based SSO
The Browser-Based SSO method uses a browser-based SSO flow to authenticate. To use this method, you will need to [connect an SSO provider](https://docs.snowflake.com/en/user-guide/admin-security-fed-auth-configure-idp) to your Snowflake account.

## Native SSO through Okta
The Native SSO through Okta method uses Okta to authenticate. To use this method, you will need to have an Okta account with MFA disabled connected to your Snowflake account.

