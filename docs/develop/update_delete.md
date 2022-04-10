# Update & Delete

## Update

QuestDB is a timeseries database optimized to insert data.

We do not support SQL `UPDATE` statements yet, but it is a feature in the
[works](/docs/faq/troubleshooting/#how-do-i-update-or-delete-a-row).
You may group by the latest version of your data and insert a new row with the
updated values.

Here's a worked example using the timestamp column:

```questdb-sql
create table takeaway_order (
    ts timestamp,
    id symbol,
    status symbol)
        timestamp(ts);

insert into 'takeaway_order' values (now(), 'order1', 'placed');
insert into 'takeaway_order' values (now(), 'order2', 'placed');
insert into 'takeaway_order' values (now(), 'order1', 'cooking');
insert into 'takeaway_order' values (now(), 'order1', 'in-transit');
insert into 'takeaway_order' values (now(), 'order1', 'arrived');
insert into 'takeaway_order' values (now(), 'order3', 'placed');
insert into 'takeaway_order' values (now(), 'order3', 'cooking');
insert into 'takeaway_order' values (now(), 'order3', 'in-transit');
```

We join the latest timestamp of an order id against the rest of the data to
obtain full details.

```questdb-sql
with
    ts_takeaway_order as (
        select
            max(ts) as ts,
            id
        from
            'takeaway_order' group by id)
select
    o.*
from
    ts_takeaway_order ts_o
    inner join 'takeaway_order' o
    on ts_o.ts = o.ts
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
