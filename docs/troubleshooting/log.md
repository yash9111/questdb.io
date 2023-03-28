---
title: Log
description: Details about QuestDB log
---

QuestDB log provides database information. This page presents log level, their details, and where to configure and find the log.

## Log location


### QuestDB open source

QuestDB creates the following file structure in its [root_directory](/docs/concept/root-directory-structure/):

```filestructure
questdb
├── conf
├── db
├── log
├── public
└── snapshot (optional)
```

Log files are stored in the `log` folder:

```filestructure
├── log
│   ├── stdout-2020-04-15T11-59-59.txt
│   └── stdout-2020-04-12T13-31-22.txt
```


### QuestDB Cloud

Log can be found in the `metrics` panel and can be searched by:

- using the time filter 
- dragging and selecting the time range of the monitoring metrics

## Log levels

QuestDB log provides the following types of log information:

Type | Marker | Details | Default
-- | -- | -- | --
Advisory | A | Startup information such as hosts, listening ports, etc. Rarely used after startup | Enabled
Critical | C | Internal database errors. Serious issues. Things that should not happen in general operation. | Enabled
Error | E | An error, usually (but not always) caused by a user action such as inserting a `symbol` into a `timestamp` column. For context on how this error happened, check for Info-level messages logged before the error. | Enabled
Info | I | Logs for activities. Info-level messages often provide context for an error if one is logged later. | Enabled
Debug | D | Finer details on what is happening. Useful to debug issues. | Disabled

For more information, see the [source code](https://github.com/questdb/questdb/blob/master/core/src/main/java/io/questdb/log/LogLevel.java) on GH.

## Log configuration

QuestDB logging can be quickly forced globally to `DEBUG` via either providing
the java option `-Debug` or setting the environment variable `QDB_DEBUG=true`.