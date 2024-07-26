---
title: Embedded
sidebar_position: 5
---

Evidence can be used to deliver insights to your customers, partners or users as a fully white-labeled experience. This can be achieved via Portal or Embedded deployments.

(Table comparing Portal and Embedded)
- Who handles auth
- Where are users managed
- Is an existing SaaS app required
- Which auth methods are supported

## Portal

The portal is a fully whitelabelled Evidence Cloud experience. 

It is a standalone application that you can deliver to users, without requiring an existing app. You create multiple deployments of the app for different customers, and each accesses their own data when they log in.

The authentication layer is fully managed via Evidence Cloud and you can use the Cloud Console to manage users, send invites, and configure your app.

(Diagram)

## Embedded

Evidence can be embedded inside your existing application. 

In this case, authentication is managed by your application, and Evidence authenticates the user via a JWT token passed from your app. Unique deployments are created for each customer, and the correct deployment is loaded based on the JWT token.

Most external IdP providers are supported. If you have a custom IdP, Evidence can work with you to integrate it.

(Diagram)