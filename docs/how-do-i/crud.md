# Insert, Query, Update, Delete

## Insert

For ad-hoc or one-off data, you can use SQL insert statements or CSV uploads
via the PostgreSQL wire protocol or via the HTTP REST API.
For applications that need to insert large volumes of data, we suggest ILP.

Here are all your options:

* [Insert data from the ILP protocol](/docs/connect/ilp)
  * High performance.
  * Optional automatic timestamps.
  * Optional integrated authentication.
  * Client libraries in various programming languages.
* [Web Console](/docs/connect/web-console)
  * CSV upload.
  * SQL `INSERT` statements.
* [REST API](/docs/connect/rest)
  * CSV upload.
  * SQL `INSERT` statements.
  * Use `curl` on the command line.
* [PostgreSQL Wire Protocol](/docs/connect/postgres)
  * SQL `INSERT` statements.
  * Use `psql` on the command line.
  * Use your favorite tools and client libraries.

## Query

For ad-hoc SQL queries, including CSV download and charting use the web console.
Applications can choose between the HTTP REST API which returns JSON or use
the PostgreSQL wire protocol.

Here are all your options:

* [Web Console](/docs/connect/web-console)
  * SQL `SELECT` statements.
  * Download query results as CSV.
  * Chart query results.
* [REST HTTP API](/docs/connect/rest)
  * SQL `SELECT` statements as JSON or CSV.
  * Result paging.
* [PostgreSQL Wire Protocol](/docs/connect/postgres)
  * SQL `SELECT` statements.
  * Use `psql` on the command line.
  * Use your favorite tools and client libraries.

## Update

QuestDB is a timeseries database optimized to insert data.

We do not support SQL `UPDATE` statements yet, but it is a feature in the
[works](/docs/faq/troubleshooting/#how-do-i-update-or-delete-a-row).
You may group by the latest version of your data and insert a new row with the
updated values.

Here's a worked example using the timestamp column:

```questdb-sql
CREATE TABLE takeaway_order (
    ts timestamp,
    id symbol,
    status symbol)
        TIMESTAMP(ts);

INSERT INTO takeaway_order VALUES (now(), 'order1', 'placed');
INSERT INTO takeaway_order VALUES (now(), 'order2', 'placed');
INSERT INTO takeaway_order VALUES (now(), 'order1', 'cooking');
INSERT INTO takeaway_order VALUES (now(), 'order1', 'in-transit');
INSERT INTO takeaway_order VALUES (now(), 'order1', 'arrived');
INSERT INTO takeaway_order VALUES (now(), 'order3', 'placed');
INSERT INTO takeaway_order VALUES (now(), 'order3', 'cooking');
INSERT INTO takeaway_order VALUES (now(), 'order3', 'in-transit');
```

We join the latest timestamp of an order id against the rest of the data to
obtain full details.

```questdb-sql
WITH
    ts_takeaway_order AS (
        SELECT
            max(ts) AS ts,
            id
        FROM
            takeaway_order GROUP BY id)
SELECT
    o.*
FROM
    ts_takeaway_order ts_o
    INNER JOIN 'takeaway_order' o
    ON ts_o.ts = o.ts
```

This results in the latest state for each order:

|*timestamp* ts             |id *symbol*|status *symbol*|
|---------------------------|-----------|---------------|
|2022-04-07T15:33:43.944922Z|order1     |arrived        |
|2022-04-07T15:33:37.370694Z|order2     |placed         |
|2022-04-07T15:33:50.829323Z|order3     |in-transit     |

If timestamps don't work for you here, you can also use an extra integer column
called `version`, an extra boolean `deleted` column or similar.


:::note

This approach also benefits from being able to retain access to all data
historically and query all intermediate stages. It is also the basis of
organizing data for
[bi-temporality](https://martinfowler.com/articles/bitemporal-history.html).

:::

## Delete

QuestDB is a timeseries database optimized to insert data.

Like the SQL `UPDATE` statement, we also do not support `DELETE` statements.
This is a feature in the
[works](/docs/faq/troubleshooting#how-do-i-update-or-delete-a-row).

Workarounds:
  * Use the same work-around detailed above for `UPDATE`, for example by adding
    a `deleted` column and selecting `.. WHERE NOT deleted`.
  * Create [partitioned tables](/docs/concept/partitions) and delete
    partitions no longer in use with
    [`ALTER TABLE DROP PARTITION`](/docs/reference/sql/alter-table-drop-partition).
    This is useful if you only intend to keep, for example, a month's
    worth of data.
