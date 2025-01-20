---
sidebar_position: 4
hide_table_of_contents: false
title: Windows IIS
description: Deploy Evidence to a Windows IIS server.
---

Windows IIS server is a part of any Windows Server operating system and is also available in the Windows Desktop business versions. This makes IIS a readily available static site server.

## Prerequisites

- A Windows desktop or server operating system with the Internet Information Services feature enabled. The following sub-features are required:
  - Web Management Tools > IIS Management Console
  - World Wide Web Services > Common HHTP Features:
    - Default Document
    - Static Content
  - Performance Features > Static Content Compression
- A built Evidence project to copy to the IIS server

## Deploy Evidence to IIS

1. Open the IIS Manager
2. Add a new website
3. Copy the files from the Evidence build folder to the Physical Path of the new website
4. Check permissions
   - Make sure the permissions are set correctly on the Physical Path folder
   - Make sure the Application Pool is running under a user that has access to the Physical Path folder

## Setting MIME-Types

Evidence uses .arrow files to load data into the static site. IIS does not know these file-types so we need to make it aware of them.

1. Click on your website
2. In the main window click on "MIME Types"
3. In the Action pane on the right click "Add" and add the following "MIME types"
   - Extension: .arrow
     - MIME Type: application/vnd.apache.arrow.file
   - Extension: .arrows (note the '*s*' at the end)
     - MIME Type: application/vnd.apache.arrow.stream

## Start IIS

You should now be able to start IIS and browse to your website. You can update your site by copying the new build files to your website's Physical Path.
