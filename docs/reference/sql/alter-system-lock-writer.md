---
title: ALTER SYSTEM (UN)LOCK WRITER
sidebar_label: (UN)LOCK WRITER
description: ALTER SYSTEM (UN)LOCK WRITER keyword reference documentation.
---

Lock and unlock tables. Locked tables are still available for reading, but inaccessible for writing or schema changes
until unlocked.

A table must exist before it is locked.
Locking and unlocking a table is considered to be a write operation. Users with a read-only access cannot perform
`ALTER SYSTEM (UN)LOCK WRITER`.

This operation is intended to be used during maintenance procedures, to prevent a table from being manipulated in any
way.

## Syntax

![Flow chart showing the syntax of the ALTER TABLE keyword](/img/docs/diagrams/alterSystemLockWriter.svg)

## Examples

Lock table `ratings` for writing. 

```questdb-sql title="Lock table"
ALTER SYSTEM LOCK WRITER ratings;
```

Unlock table `ratings`.

```questdb-sql title="Lock table"
ALTER SYSTEM UNLOCK WRITER ratings;
```