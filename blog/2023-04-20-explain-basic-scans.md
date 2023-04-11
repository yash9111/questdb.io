---
title: "EXPLAIN scan types"
author: Bolek Ziobrowski
author_title: QuestDB Team
author_url: https://github.com/bziobrowski
author_image_url: https://avatars.githubusercontent.com/bziobrowski
description:
  A tour of scan types available in QuestDB.
image: /img/blog/2023-04-20/banner.jpg
tags: [explain, SQL, execution plan, table scan, index scan]
slug: explain-sql-index-table-scan
---

<!--truncate-->

import Banner from "@theme/Banner"

<Banner
alt="Image of a hard disk drive."
height={433}
src="/img/blog/2023-04-20/banner.jpg"
width={650}
>
Photo by <a href="https://unsplash.com/@benjaminlehman">Benjamin Lehman</a> via{" "}
<a href="https://unsplash.com">Unsplash</a>
</Banner>

Welcome to another post on sql performance tuning !
This time we'll explore the various scan types (a.k.a. access methods) QuestDB supports.
It is necessary to understand them before tackling more complex queries. 

What are scan types  ? 
Scan type is an algorithm used to find and access data. 
Imagine binary search on sorted data, but with partitions, indexes and column data files instead of arrays.   
There are two basic scan types in QuestDB, table and index scan.
The difference is that the former touches table data directly, while latter goes through index first. 
Both occur in a number of variants so let's go through the list and explore them in depth.

All examples below use tables available in the [QuestDB demo instance](https://demo.questdb.io/).
Schema: 

```questdb-sql
CREATE TABLE trades (
 symbol SYMBOL,
 side SYMBOL,
 price DOUBLE,
 amount DOUBLE,
 timestamp TIMESTAMP
) timestamp (timestamp) PARTITION BY DAY WAL;
```   

### Table scan

Scans all table rows. Since QuestDB's storage model is column-based, the amount of data to read depends on columns used in the query. 
It might be a single column/small percentage of table data, or all columns/whole table data.   

<Banner
alt="Table forward scan."
height={433}
src="/img/blog/2023-04-20/forward_scan.svg"
width={650}
/>

#### Table forward scan

Scans all table rows starting at first row of the oldest partition and ending at last row of the latest partition.
Differentiating between forward and backward scan makes sense only for tables with designated timestamp because they store data in that timestamp order.
For tables without designated timestamp scan direction doesn't make a difference because there's no predictable order to data.
Let's check a simple select: 

```questdb-sql
explain select * from trades 
order by timestamp
```

 | QUERY PLAN                                            |
|-------------------------------------------------------|
| DataFrame                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;Row forward scan              |
| &nbsp;&nbsp;&nbsp;&nbsp;Frame forward scan on: trades |

As expected, optimizer recognized that `order by timestamp` can be implemented simply by forward scanning the table, no sorting required.
In `EXPLAIN` output a Table forward scan is represented on table level - `Frame forward scan` and partition level - `Row forward scan`.

#### Table backward scan

Scans all table rows starting at latest partition and ending at oldest partition.

<Banner
alt="Table backward scan."
height={433}
src="/img/blog/2023-04-20/backward_scan.svg"
width={650}
/>

```questdb-sql
explain select * from trades 
order by timestamp desc
```

| QUERY PLAN                                            |
|-------------------------------------------------------|
| DataFrame                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;Row backward scan              |
| &nbsp;&nbsp;&nbsp;&nbsp;Frame backward scan on: trades |

Same as above, optimizer implements sort with backward scan. 
If you run the same query on table without the designated timestamp, unsurprisingly, you'll get : 


| QUERY PLAN                                                                     |
|--------------------------------------------------------------------------------|
| Sort light                                                                     |
| &nbsp;&nbsp;keys: [timestamp desc]                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;DataFrame                                              |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Row backward scan              |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Frame backward scan on: trades |

Sort is required here because data is in unknown order.

<Banner
alt="Interval forward scan."
height={433}
src="/img/blog/2023-04-20/interval_forward_scan.svg"
width={650}
/>

#### Interval forward scan

When query contains a reasonable condition on designated timestamp, QuestDB engine can use it to limit scanning to one or more intervals.
Interval boundaries are found by binary searching designated timestamp column, for instance :

```questdb-sql
explain select * from trades 
where timestamp in '2023-01-20'
```

 | QUERY PLAN                                                                                 |
|--------------------------------------------------------------------------------------------|
| DataFrame                                                                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;Row forward scan                                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;Interval forward scan on: trades                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;intervals: [static=[1674172800000000,1674259199999999] |

Plan above shows that optimizer reduced scanning to single interval equal to 2023-01-20 day partition.  
Engine might even detect conflicting conditions and not run any scan at all, e.g.

```questdb-sql
explain select * from trades 
where timestamp in '2023-01-20' 
and timestamp < '2022-01-01'
```
produces :

| QUERY PLAN     |
|----------------|
| Empty table    |

If predicate is too complex (especially if designated timestamp is used as function argument), engine will fall back to default table scan with filter, e.g. 

```questdb-sql
explain select * from trades 
where dateadd('m', 1, timestamp) in '2023-01-20'
```

| QUERY PLAN                                                                          |
|-------------------------------------------------------------------------------------|
| Async Filter                                                                        |
| &nbsp;&nbsp;filter: dateadd('m',1,timestamp) in [1674172800000000,1674259199999999] |
| &nbsp;&nbsp;workers: 24                                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;DataFrame                                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Row forward scan                    |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Frame forward scan on: trades       |

Rewriting predicate as `timestamp between '2023-01-19T23:59:00.000000Z' and '2023-01-20T23:59:00.000000Z'` makes query use interval filter.  
Lesson - keep designated timestamp predicates clean and simple!

#### Interval backward scan

Same as forward scan but runs from last row of last interval to first row of first interval.   

```questdb-sql
explain select * from trades 
where timestamp in '2023-01-20' 
order by timestamp desc
```

| QUERY PLAN                                                                                 |
|--------------------------------------------------------------------------------------------|
| DataFrame                                                                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;Row backward scan                                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;Interval backward scan on: trades                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;intervals: [static=[1669852800000000,1669939199999999] |

### Index scan

Index scan first reads row id data associated with one or more index keys and then respective data from the table.
See [index]((/docs/concept/indexes/)) for more information about QuestDB indexes. 
`trades` table doesn't have any index so let's switch to another demo table, `pos`, with the following schema : 

```questdb-sql
CREATE TABLE pos (
 time TIMESTAMP,
 id SYMBOL INDEX,
 lat DOUBLE,
 lon DOUBLE,
 geo6 GEOHASH(6c),
 geo12 GEOHASH(12c)
) timestamp (time) PARTITION BY DAY
```

<Banner
alt="Index forward scan."
height={433}
src="/img/blog/2023-04-20/index_forward_scan.svg"
width={650}
/>

####  Index forward scan with single key

For any given index key, row ids are stored in table order, which is the same as timestamp order for tables that have designated timestamp.
That means when querying for a single index key ordering can be implemented with scan direction alone, no sorting required.
Following queries : 

```questdb-sql
explain select * from pos where id in ('X')
explain select * from pos where id in ('X') order by time 
```

produce the same plan :

 | QUERY PLAN                                                       |
|------------------------------------------------------------------|
| DeferredSingleSymbolFilterDataFrame                              |
| &nbsp;&nbsp;&nbsp;&nbsp;Index forward scan on: id deferred: true |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='X'               |
| &nbsp;&nbsp;&nbsp;&nbsp;Frame forward scan on: pos               |

Note - `deferred: true` means symbol wasn't found in symbol dictionary so resolution was delayed until run time. 

#### Index backward scan with single key

What if we switch order by direction and add predicate on timestamp?  

```questdb-sql
explain select * from pos 
where id in ('X') 
and time in '2023-02-01' 
order by id, time desc
```

This yields : 

| QUERY PLAN                                                                                 |
|--------------------------------------------------------------------------------------------|
| DeferredSingleSymbolFilterDataFrame                                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;Index backward scan on: id deferred: true                          |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='X'                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;Interval forward scan on: pos                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;intervals: [static=[1675209600000000,1675295999999999] |
                                                                                               
As you can see, not only was potential sort replaced with backward scan, but scanning was reduced to a single timestamp interval. 

#### Index scan with multiple keys

Things get more interesting when there's more than one index key to scan.
We can scan row ids in:
- `Index-order` - first read all row ids associated with key k1, then k2, etc. or   
- `Table-order` - scan the minimum row id available from all per-key row ids until there's none left.   
Both have pros and cons, so let's look at a simple example. 

#### Index scan with multiple values in table order

Reads all row ids associated in table (or physical) order.
It  means memory & disk access is as sequential as possible, which is a good default approach.
This type scan type is comparable to PostgreSQL's Bitmap Heap Scan.

<Banner
alt="Index forward scan in table order."
height={433}
src="/img/blog/2023-04-20/index_forward_scan_table_order.svg"
width={650}
/>

```questdb-sql
explain select * from pos 
where id in ('X', 'Y')
```

| QUERY PLAN                                                                               |
|------------------------------------------------------------------------------------------|
| FilterOnValues                                                                           |
| &nbsp;&nbsp;&nbsp;&nbsp;Table-order scan                                                 |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Index forward scan on: id deferred: true |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='X'               |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Index forward scan on: id deferred: true |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='Y'               |
| &nbsp;&nbsp;&nbsp;&nbsp;Frame forward scan on: pos                                       |

#### Index scan with multiple values in index order

Scans table rows using row ids associated with first index key value, then second, ..., and finally, the last index value.
It might be used to avoid sorting at the price of potentially more random memory and disk accesses.

<Banner
alt="Index forward scan in index order."
height={433}
src="/img/blog/2023-04-20/index_forward_scan_index_order.svg"
width={650}
/>

```questdb-sql
explain select * from pos 
where id in ('X', 'Y') 
and time in '2023-02-01' 
order by id,time desc
```

 | QUERY PLAN                                                                                 |
|--------------------------------------------------------------------------------------------|
| FilterOnValues symbolOrder: asc                                                                            |
| &nbsp;&nbsp;&nbsp;&nbsp;Cursor-order scan                                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Index backward scan on: id deferred: true  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='X'                 |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Index backward scan on: id deferred: true  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: id='Y'                 |
| &nbsp;&nbsp;&nbsp;&nbsp;Interval forward scan on: pos                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;intervals: [static=[1675209600000000,1675295999999999] |

Note that while technically we're doing a forward interval scan, it doesn't really matter because there's just one interval to scan. 
While this makes sense with a single partition, it doesn't extend to many.
That's because on a higher level the sql engine iterates over partitions and doing so mixes order. 

Now that we're done with the basics, let's dig a bit deeper.  
Table/Frame scan - in literature the common term to use is Full Table Scan. 
That's because scanning a table might have to, in the pessimistic case, read all table rows. 
On the other hand, for certain queries, it might be fine to read a handful of rows.
Say we need to count the number of rows in `trades` table :  

```questdb-sql
select count(*) from trades;
```
it returns 1634599313 in just 240μs.

Is the response time right ? 
According to plan : 

| QUERY PLAN                                                                    |
|-------------------------------------------------------------------------------|
| Count                                                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;DataFrame                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Row forward scan              |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Frame forward scan on: trades |

it should be doing a full table scan but response time is way too fast. 
Reading all timestamp values, that is about 12GB of memory, in 240μs would require 50TB/s bandwidth, way higher than the 'lousy' 20GB/s available on demo instance.
What does it do ?
If possible, instead of iterating over all records, `Count` plan node iterates over partitions and sums the number of rows in each.

Keep in mind that this optimization only makes sense in absence of where conditions. For comparison, the following query : 

```questdb-sql
select count(*) from trips where total_amount > 0 ;
```

has to evaluate predicate for each table row, and even though it uses parallel execution, it takes about 7 seconds to complete.

Now, let's assume we need to check if any of the trips finished at specific location.
A simple way to phrase it is : 

```questdb-sql
select count(*) 
from trips
where dropoff_location_id = 110 
```

Query returns in 120 ms, which is nice, but can we make it faster ? 
Since we're only interested in knowing if any trip meets the criteria, we don't really need the exact count.
Instead, we can find the first matching row and stop : 

```questdb-sql
select count(*) from
(
  select * 
  from trips
  where dropoff_location_id = 110 
  limit 1
)
```

This time we got results a bit faster, in 90 ms, and that means first row is away from start of the table and query has to scan more than half of the table.
What if we scan from the end then ? How 'full' would scan be then ? Would it be half full or half empty ? 

```questdb-sql
select count(*) from
(
  select * 
  from trips
  where dropoff_location_id = 110 
  order by pickup_datetime desc
  limit 1
)
```

Turns out it's not full at all!  Result comes ~ 12 times faster, in 10 ms.
It makes sense because the designated timestamp value of matching row is `2019-05-21T20:51:26.000000Z`, 
very close to maximum in the table - `2019-06-30T23:59:56.000000Z`.
Let's check execution plan :  

 | QUERY PLAN                                                                    |
|-------------------------------------------------------------------------------|
| Count                                                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;Async JIT Filter                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;limit: 1                                  |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;filter: dropoff_location_id=110           | 
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;workers: 24                               |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DataFrame                     |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Row backward scan             |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Frame backward scan on: trips |

Comparing all three plans we see:
- "limit: 1" under `Async JIT Filter` node meaning that async filtering stops at first matching row
- backward scan direction under `DataFrame`

Remember - the approach above only makes sense if data is really close to end of table, otherwise it might slow things down.  

### Summary  

Now you should have a good grasp on the basic scan types available in QuestDB, that is :
- table scan 
- interval scan
- index scan (in table and index order)

and related optimizations available for tables with designated timestamp.

Happy query tuning !
