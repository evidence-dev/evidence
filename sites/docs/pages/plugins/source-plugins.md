---
sidebar_position: 2
hide_table_of_contents: false
title: Data Source Plugins
description: Source plugins enable you to add new data source types to your app. 
---

Evidence includes a plugin system which can be used to add components and data sources to your app. 

Source plugins enable you to add new data source types to your app. Once you have installed and registered a source plugin, you will be able to configure any associated connection settings in the settings UI.  

To use a plugin, you need to **install** and **register** it in your project.

## Installing Source Plugins 

```bash
npm install @cool-new-db/evidence-source-plugin
```

## Registering Source Plugins 

Once the plugin is installed, add it to `evidence.plugins.yaml` to register it in your project. 

```yaml
components:
    @evidence-dev/core-components: {}
databases: 
    @cool-new-db/evidence-source-plugin
```

## Configuring Source Plugins 

Restart the development server after installing and registering the plugin, then visit `localhost:3000/settings`. 

