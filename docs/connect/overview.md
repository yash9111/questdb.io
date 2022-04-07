# Network Endpoints Overview

You can interact with a QuestDB database in one of several ways.

These are the network endpoints you may connect to:

|Network Endpoint|Port|Inserting data|Querying data|
|----------------|----|--------------|-------------|
|[Web Console](web-console)|9000|SQL `insert`, CSV|SQL `select`, charting|
|[InfluxDB Line Protocol](ilp)|9009|High performance bulk insert|-|
|[HTTP REST API](rest)|9000|SQL `insert`, CSV|SQL `select`, CSV|
|[PostgreSQL Protocol](postgres)|8812|SQL `insert`|SQL `select`|


## Web console

The [web console](web-console) is a general admin and query interface.
It's great for quickly trying things out. You can also chart your query results.

Connect your web browser to http://questdb-server:9000/, e.g.
[http://localhost:9000/](http://localhost:9000/).

import Screenshot from "@theme/Screenshot"

<Screenshot
  alt="Screenshot of the Web Console"
  height={375}
  small
  src="/img/docs/console/overview.png"
  width={500}
/>

## InfluxDB Line Protocol

The fastest way to insert data into QuestDB is using the InfluxDB Line
Protocol (ILP).

It is an insert-only protocol that bypasses SQL `insert` statements achieving
higher throughput.

```shell
readings,city=London temperature=23.2 1465839830100400000\n
readings,city=London temperature=23.6 1465839830100700000\n
readings,make=Honeywell temperature=23.2,humidity=0.443 1465839830100800000\n
```

Our [ILP tutorial](ilp) covers ingesting data with our various client libraries.

For a more in-depth understanding, see our
[protocol documentation](/docs/reference/api/ilp/overview).

## HTTP REST API

The HTTP interface that hosts the web console also provides a REST API for
importing data and querying.

```shell
curl -F data=@data.csv http://localhost:9000/imp
```

Read our [REST tutorial](rest) for code examples, and our
[REST reference](/docs/reference/api/rest) for further details.

## PostgreSQL Wire Protocol

QuestDB also supports the same wire protocol as PostgreSQL, allowing you to
connect and query the database with various third-party pre-existing client
libraries and tools.

```python
import psycopg2

connection = None
try:
    connection = psycopg2.connect(
        user="admin",
        password="quest",
        host="127.0.0.1",
        port="8812",
        database="qdb")
finally:
    if (connection):
        connection.close()
```

See how you can connect through the [PostgreSQL Wire protocol](postgres) from
different programming languages.
