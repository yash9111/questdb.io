---
title: ALTER SYSTEM
sidebar_label: ALTER SYSTEM
description: ALTER SYSTEM keyword reference documentation.
---

Lock and unlock tables. Locked tables are still available for reading, but inaccessible for writing until
unlocked. A locked table won't accept new data and its schema cannot be changed either. 

This is useful during e.g. maintenance procedures when you want to prevent a table being manipulated in anyway.

## Syntax

![Flow chart showing the syntax of the ALTER TABLE keyword](/img/docs/diagrams/alterSystem.svg)

## Examples

Lock table `ratings` for writing. 

```questdb-sql title="Lock table"
ALTER SYSTEM LOCK WRITER ratings ;
```

Unlock table `ratings`.

```questdb-sql title="Lock table"
ALTER SYSTEM UNLOCK WRITER ratings ;
```

Locking and unlocking a table is considered to a be a write operation. It means users with a read-only access cannot
perform lock/unlock. A table must exist before it's locked. 