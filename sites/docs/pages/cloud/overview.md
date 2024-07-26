---
title: Overview
sidebar_position: 1
---

## What is Evidence Cloud?

Evidence Cloud is a platform for deploying Evidence Apps. It allows you to host, schedule, manage access to, and monitor your Evidence Apps.

It's comes with enterprise-grade features that allow you to deliver Evidence Apps to your users.

<CloudOverview/>


You can sign up for Evidence Cloud [here](https://evidence.app) (GitHub account required).

## What is it not?

- **It's not a Cloud IDE:** You can't write Evidence markdown using Evidence Cloud, you do still do this in your environment.

## Features

<FeatureCard title="Authentication" description="Secure access to your Evidence Apps using SSO or email/password." />
<FeatureCard title="Multiple Apps" description="Publish multiple Evidence Apps under a single organization." />
<FeatureCard title="User Management" description="Manage who can access your Evidence Apps. Configure access per App." />
<FeatureCard title="Custom Domain" description="Choose a unique App domain on Evidence Cloud, or you bring your own." />
<FeatureCard title="Builder" description="Schedule data refresh, build on push, and manually trigger builds." />
<FeatureCard title="Logging" description="View build logs to debug issues." />
<FeatureCard title="Teams" description="Collaborate with your team to publish Evidence Apps." />

## Performance

Evidence Apps build and load data from parquet files stored on the internet. While you can host these files anywhere, Evidence Cloud is optimized to serve these files quickly:

- **Image**: An image that works out of the box
- **Performance**: Fast serving of parquet files
- **Memory**: Memory optimization to prevent out of memory errors during build
- **Cache**: Customized cache refresh to prevent stale data