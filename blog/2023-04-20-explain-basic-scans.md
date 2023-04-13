---
title: "EXPLAIN scan types"
author: Bolek Ziobrowski
author_title: QuestDB Team
author_url: https://github.com/bziobrowski
author_image_url: https://avatars.githubusercontent.com/bziobrowski
description: A tour of scan types available in QuestDB.
image: /img/blog/2023-04-20/banner.png
tags: [explain, SQL, execution plan, table scan, index scan]
slug: explain-sql-index-table-scan
---

import Banner from "@theme/Banner"

<Banner
  alt="Image of a hard disk drive."
  height={433}
  src="/img/blog/2023-04-20/banner.png"
  width={650}
></Banner>

Welcome to another post on SQL performance tuning! This time we'll explore the
various database scan types QuestDB supports. It is necessary to understand them
before tackling more complex queries.

What are scan types? Scan types are also called access methods. They refer to
the algorithm used to find and access data. It is comparable to a binary search
on sorted data, but instead of searching arrays, the scan type search for
partitions, indexes, and column data files.

QuestDB supports two main scan types, table and index scan. The difference is
that the former touches table data directly, while the latter goes through the
index first. Both types include sub-types and variants.

When optimizing a SQL query, it is crucial to understand how the SQL server
accesses the database. So let's go through the types and explore them in depth.

All the examples in this article use tables available in the
[QuestDB demo instance](https://demo.questdb.io/).

The following is the schema for the table `trades`:

```questdb-sql
CREATE TABLE trades (
 symbol SYMBOL,
 side SYMBOL,
 price DOUBLE,
 amount DOUBLE,
 timestamp TIMESTAMP
) timestamp (timestamp) PARTITION BY DAY WAL;
```

## Table scan

As the name suggests, table scan scans all table rows. Since QuestDB's storage
model is column-based, the amount of data to read depends on the columns used in
the query. It might be a single column/small percentage of table data or all
columns/whole table data.

<Banner
  alt="Table forward scan."
  height={433}
  src="/img/blog/2023-04-20/forward_scan.svg"
  width={650}
/>

<Banner
  alt="Table backward scan."
  height={433}
  src="/img/blog/2023-04-20/backward_scan.svg"
  width={650}
/>

Table scans may occur in two directions: forward or backward. 

Forward scans start at the first row of the oldest partition and stop at the
last row of the latest one. Differentiating between forward and backward scans
only makes sense for tables with a designated timestamp because they store data
in that timestamp order. For tables without any designated timestamp, the scan
direction doesn't make a difference because there's no predictable order to
data.

Let's look at a simple `SELECT` statement:

```questdb-sql
EXPLAIN
SELECT * FROM trades
ORDER BY timestamp;
```

| QUERY PLAN                                            |
| ----------------------------------------------------- |
| DataFrame                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;Row forward scan              |
| &nbsp;&nbsp;&nbsp;&nbsp;Frame forward scan on: trades |

In the `EXPLAIN` output, a table forward scan is represented on the table level
as `Frame forward scan`, and on the partition level, `Row forward scan`.

Opposite to table forward scans, table backward scans scan all table rows
starting at the latest partition and ending at the oldest partition:

```questdb-sql
EXPLAIN
SELECT * FROM trades
ORDER BY timestamp DESC
```

| QUERY PLAN                                             |
| ------------------------------------------------------ |
| DataFrame                                              |
| &nbsp;&nbsp;&nbsp;&nbsp;Row backward scan              |
| &nbsp;&nbsp;&nbsp;&nbsp;Frame backward scan on: trades |

The optimizer implements sorting with a backward scan. If you run the same query on a table without the designated timestamp, unsurprisingly, you'll get:

| QUERY PLAN                                                                     |
| ------------------------------------------------------------------------------ |
| Sort light                                                                     |
| &nbsp;&nbsp;keys: [timestamp desc]                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;DataFrame                                              |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Row backward scan              |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Frame backward scan on: trades |

Sorting is required here because the data is in an unknown order.

### Interval scan

<Banner
  alt="Interval forward scan."
  height={433}
  src="/img/blog/2023-04-20/interval_forward_scan.svg"
  width={650}
/>

In addition to the standard table scans, QuestDB implements a more optimized type of table scans for queries with a reasonable condition on the designated timestamp. We call this "Interval scans".

The QuestDB engine can use it to limit scanning to one or more intervals. Interval boundaries are defined by binary searching the designated timestamp column, for instance:

```questdb-sql
EXPLAIN
SELECT *  trades
WHERE timestamp in '2023-01-20'
```

| QUERY PLAN                                                                                 |
| ------------------------------------------------------------------------------------------ |
| DataFrame                                                                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;Row forward scan                                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;Interval forward scan on: trades                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;intervals: [static=[1674172800000000,1674259199999999] |

As the plan shoes,  the optimizer reduces scanning to a single interval equal to the
2023-01-20 day partition.  

The engine might even detect conflicting conditions and not run any scan at all, e.g.:

```questdb-sql
EXPLAIN
SELECT * FROM trades
WHERE timestamp in '2023-01-20'
AND timestamp < '2022-01-01';
```

| QUERY PLAN  |
| ----------- |
| Empty table |

If the predicate is too complex (especially if the query uses the designated timestamp as a function argument), the engine will fall back to the default table scan with filter, e.g.:

```questdb-sql
EXPLAIN
SELECT * FROM trades
WHERE dateadd('m', 1, timestamp) in '2023-01-20'
```

| QUERY PLAN                                                                          |
| ----------------------------------------------------------------------------------- |
| Async Filter                                                                        |
| &nbsp;&nbsp;filter: dateadd('m',1,timestamp) in [1674172800000000,1674259199999999] |
| &nbsp;&nbsp;workers: 24                                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;DataFrame                                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Row forward scan                    |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Frame forward scan on: trades       |

Rewriting the predicate to
`timestamp between '2023-01-19T23:59:00.000000Z' and '2023-01-20T23:59:00.000000Z'` makes the query use the interval filter.

Lesson - keep the designated timestamp predicates clean and simple!

Interval scans also contain a backward type. It runs in the reverse order from its forward counterpart: from the last row of the last interval to the first row of the first interval.

```questdb-sql
EXPLAIN
SELECT * FROM trades
WHERE timestamp in '2023-01-20'
ORDER BY timestamp DESC
```

| QUERY PLAN                                                                                 |
| ------------------------------------------------------------------------------------------ |
| DataFrame                                                                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;Row backward scan                                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;Interval backward scan on: trades                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;intervals: [static=[1669852800000000,1669939199999999] |

## Index scan

Index scan first reads row id data associated with one or more index keys and then respective data from the table. See documentation for more information on indexes. The `trades` table doesn't have any index, so let's switch to another demo table, `pos`, with the following schema:

```questdb-sql
CREATE TABLE pos (
 time TIMESTAMP,
 id SYMBOL INDEX,
 lat DOUBLE,
 lon DOUBLE,
 geo6 GEOHASH(6c),
 geo12 GEOHASH(12c)
) timestamp (time) PARTITION BY DAY;
```

<Banner
  alt="Index forward scan."
  height={433}
  src="/img/blog/2023-04-20/index_forward_scan.svg"
  width={650}
/>

### Index scan with a single key

For any given index key, row ids are stored in table order, which is the same as
timestamp order for tables with the designated timestamp. That means that when
querying for a single index key, the ordering can be implemented with the scan direction
alone without the need for sorting:

```questdb-sql
EXPLAIN SELECT * FROM pos WHERE id in ('X')
EXPLAIN SELECT * FROM pos WHERE id in ('X') ORDER BY time
```

The queries above produce the same plan:

| QUERY PLAN                                                       |
| ---------------------------------------------------------------- |
| DeferredSingleSymbolFilterDataFrame                              |
| &nbsp;&nbsp;&nbsp;&nbsp;Index forward scan on: id deferred: true |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='X'               |
| &nbsp;&nbsp;&nbsp;&nbsp;Frame forward scan on: pos               |

Note - `deferred: true` means that `symbol` is not found in the `symbol` dictionary, so
the resolution was delayed until run time.

What if we switch the `ORDER BY` direction and add a predicate on the timestamp?

```questdb-sql
EXPLAIN SELECT * FROM pos
WHERE id in ('X')
AND time in '2023-02-01'
ORDER BY id, time DESC
```

This yields:

| QUERY PLAN                                                                                 |
| ------------------------------------------------------------------------------------------ |
| DeferredSingleSymbolFilterDataFrame                                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;Index backward scan on: id deferred: true                          |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='X'                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;Interval forward scan on: pos                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;intervals: [static=[1675209600000000,1675295999999999] |

As you can see, not only is the potential sort replaced by a backward scan, but
the scanning was reduced to a single timestamp interval.

### Index scan with multiple keys

Things get more interesting when there's more than one index key to scan. We can
scan row ids in the following ways:

- `Table-order` - scans the minimum row id available from all per-key row ids
  until there's none left.  
- `Index-order` - first reads all row ids associated with key k1, then k2, etc.

Both have pros and cons, so let's look at a simple example.

#### Table order

<Banner
  alt="Index forward scan in table order."
  height={433}
  src="/img/blog/2023-04-20/index_forward_scan_table_order.svg"
  width={650}
/>

Index scan with multiple values in table order reads all row ids associated in table (or physical) order. It means that memory and disk access is as sequential as possible, which is a good default approach. This scan type is comparable to PostgreSQL's Bitmap Heap Scan.

```questdb-sql
EXPLAIN SELECT * FROM pos
WHERE id in ('X', 'Y')
```

| QUERY PLAN                                                                               |
| ---------------------------------------------------------------------------------------- |
| FilterOnValues                                                                           |
| &nbsp;&nbsp;&nbsp;&nbsp;Table-order scan                                                 |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Index forward scan on: id deferred: true |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='X'               |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Index forward scan on: id deferred: true |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='Y'               |
| &nbsp;&nbsp;&nbsp;&nbsp;Frame forward scan on: pos                                       |

#### Index order

Index scan with multiple values in index order scans table rows using row ids associated with the first index key value, followed by the second and the third. The scan continues until reaching the last index value. It might be used to avoid sorting at the price of potentially more random memory and disk accesses.

<Banner
  alt="Index forward scan in index order."
  height={433}
  src="/img/blog/2023-04-20/index_forward_scan_index_order.svg"
  width={650}
/>

```questdb-sql
EXPLAIN SELECT * FROM pos
WHERE id in ('X', 'Y')
AND time in '2023-02-01'
ORDER BY id,time DESC
```

| QUERY PLAN                                                                                 |
| ------------------------------------------------------------------------------------------ |
| FilterOnValues symbolOrder: asc                                                            |
| &nbsp;&nbsp;&nbsp;&nbsp;Cursor-order scan                                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Index backward scan on: id deferred: true  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='X'                 |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Index backward scan on: id deferred: true  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='Y'                 |
| &nbsp;&nbsp;&nbsp;&nbsp;Interval forward scan on: pos                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;intervals: [static=[1675209600000000,1675295999999999] |

Note that while technically we're doing an interval forward scan, it doesn't really matter because there's just one interval to scan. While this makes sense with a single partition, it doesn't extend to the case with multiple partitions. That's because, on a higher level, the SQL engine iterates over partitions, and in doing so it mixes the order.

## More in-depth examples

Now that we've learned the basics, let's dig a bit deeper.

The Table/Frame scan is commonly known as the Full Table Scan.
That's because scanning a table might have to, in the pessimistic case, read all
table rows. For certain queries, however, it might be fine to read just a
handful of rows. For example, we need to count the number of rows in the `trades` table :

```questdb-sql
SELECT count(*) FROM trades;
```

it returns 1634599313 in just 240μs.

Is the response time right? According to the execution plan:

| QUERY PLAN                                                                    |
| ----------------------------------------------------------------------------- |
| Count                                                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;DataFrame                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Row forward scan              |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Frame forward scan on: trades |

It should be doing a full table scan, but the response time is way too fast to be possible. Reading all timestamp values, that is about 12GB of memory, in 240μs would require 50TB/s bandwidth, way higher than the 'lousy' 20GB/s available on the demo instance. What actually happens? 

If possible, instead of iterating over all records, the `Count` plan node iterates over partitions and sums the number of rows in each.
This optimization only makes sense in the absence of `WHERE` conditions.

For comparison, the following query has to evaluate the predicate for each table row, and even with parallel execution, it still takes about 7 seconds to complete:

```questdb-sql
SELECT count(*) FROM trips WHERE total_amount > 0 ;
```

Now, let's check if any of the trips in the table finish at a specific location. A simple way to phrase it is:

```questdb-sql
SELECT count(*)
FROM trips
WHERE dropoff_location_id = 110;
```

The query returns in 120 ms, which is nice, but can we make it faster? Since we're only interested in knowing if any trip meets the criteria, we don't really need the exact count. Instead, we can find the first matching row and stop:

```questdb-sql
SELECT count(*) FROM
(
  SELECT *
  FROM trips
  WHERE dropoff_location_id = 110
  LIMIT 1
);
```

This time, the query returns in 90 ms, which means that the first row is away from the start of the table, and the engine has to scan more than half of the table. What if we do a backward scan from the end? How 'full' would the scan be then? Would it be half full or half empty?

```questdb-sql
SELECT count(*) FROM
(
  SELECT *
  FROM trips
  WHERE dropoff_location_id = 110
  ORDER BY pickup_datetime DESC
  LIMIT 1
);
```

It turns out that it's not full at all! The result comes ~ 12 times faster, in 10 ms. It makes sense because the designated timestamp value of the matching row is `2019-05-21T20:51:26.000000Z`, very close to the maximum in the table -
`2019-06-30T23:59:56.000000Z`. 

Let's check the execution plan:

| QUERY PLAN                                                                    |
| ----------------------------------------------------------------------------- |
| Count                                                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;Async JIT Filter                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;limit: 1                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: dropoff_location_id=110           |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;workers: 24                               |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DataFrame                     |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Row backward scan             |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Frame backward scan on: trips |

Comparing all three plans, we can conclude:

- `LIMIT: 1` under `Async JIT Filter` node meaning that async filtering stops at
  the first matching row
- backward scan direction under `DataFrame`

Remember that the approach above only makes sense if the data situates close to the end of
the table; otherwise, it might slow things down.

## Summary

Now you should have a good grasp on the basic scan types available in QuestDB,
that is :

- table scan
- interval scan
- index scan (in table and index order)

and related optimizations available for tables with the designated timestamp.

Happy query tuning!
