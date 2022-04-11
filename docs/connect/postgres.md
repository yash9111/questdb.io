# PostgreSQL Wire Protocol

import Tabs from "@theme/Tabs"
import TabItem from "@theme/TabItem"

QuestDB also supports the same wire protocol as PostgreSQL, allowing you to
connect and query the database with various third-party pre-existing client
libraries and tools.

You can connect to TCP port `8812` and use both `INSERT` and `SELECT` SQL
queries.

:::tip

[InfluxDB Line Protocol](ilp) is the recommended primary ingestion method in
QuestDB. SQL `INSERT` statements over the PostgreSQL offer feedback and error
reporting, but have worse overall performance.

:::

Here are a few examples demonstrating both SQL `INSERT` and `SELECT` queries:

<Tabs defaultValue="psql" values={[
  { label: "psql", value: "psql" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "NodeJS", value: "nodejs" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
]}>

<TabItem value="psql">

Create the table:

```shell
psql -h localhost -p 8812 -U admin -d qdb \
    -c "CREATE TABLE IF NOT EXISTS t1 (name STRING, value INT);"
```

Insert row:

```shell
psql -h localhost -p 8812 -U admin -d qdb -c "INSERT INTO t1 VALUES('a', 42)"
```

Query back:

```shell
psql -h localhost -p 8812 -U admin -d qdb -c "SELECT * FROM t1"
```

Note that you can also run `psql` from Docker without installing the client
locally:
```
docker run -it --rm --network=host -e PGPASSWORD=quest \
    postgres psql ....
```

</TabItem>

<TabItem value="python">

This example uses the [psycopg2](https://github.com/psycopg/psycopg2) database
adapter, which does not support prepared statements (bind variables). This
functionality is on the roadmap for the antecedent
[psychopg3](https://github.com/psycopg/psycopg3/projects/1) adapter.

```python
import psycopg2 as pg
import datetime as dt

connection = None
cursor = None
try:
    connection = pg.connect(
        user='admin',
        password='quest',
        host='127.0.0.1',
        port='8812',
        database='qdb')
    cursor = connection.cursor()

    # text-only query
    cursor.execute('''CREATE TABLE IF NOT EXISTS trades (
        ts TIMESTAMP, date DATE, name STRING, value INT)
        timestamp(ts);''')

    # insert 10 records
    for x in range(10):
        now = dt.datetime.utcnow()
        date = dt.datetime.now().date()
        cursor.execute('''
            INSERT INTO trades
            VALUES (%s, %s, %s, %s);
            ''',
            (now, date, 'python example', x))

    # commit records
    connection.commit()

    cursor.execute('SELECT * FROM trades;')
    records = cursor.fetchall()
    for row in records:
        print(row)

finally:
    if cursor:
        cursor.close()
    if connection:
        connection.close()
    print('Postgres connection is closed.')
```

</TabItem>

<TabItem value="java">


```java
package com.myco;

import java.sql.*;
import java.util.Properties;

class App {
  public static void main(String[] args) throws SQLException {
    Properties properties = new Properties();
    properties.setProperty("user", "admin");
    properties.setProperty("password", "quest");
    properties.setProperty("sslmode", "disable");

    final Connection connection = DriverManager.getConnection(
      "jdbc:postgresql://localhost:8812/qdb", properties);
    connection.setAutoCommit(false);

    final PreparedStatement statement = connection.prepareStatement(
      "CREATE TABLE IF NOT EXISTS trades (" +
      "    ts TIMESTAMP, date DATE, name STRING, value INT" +
      ") timestamp(ts);");
    statement.execute();

    try (PreparedStatement preparedStatement = connection.prepareStatement(
        "INSERT INTO TRADES  VALUES (?, ?, ?, ?)")) {
      preparedStatement.setTimestamp(
        1,
        new Timestamp(io.questdb.std.Os.currentTimeMicros()));
      preparedStatement.setDate(2, new Date(System.currentTimeMillis()));
      preparedStatement.setString(3, "abc");
      preparedStatement.setInt(4, 123);
      preparedStatement.execute();
    }
    System.out.println("Done");
    connection.close();
  }
}
```

</TabItem>

<TabItem value="nodejs">


This example uses the [`pg` package](https://www.npmjs.com/package/pg) which
allows for quickly building queries using Postgres wire protocol. Details on the
use of this package can be found on the
[node-postgres documentation](https://node-postgres.com/).

This example uses naive `Date.now() * 1000` inserts for Timestamp types in
microsecond resolution. For accurate microsecond timestamps, the
[node-microtime](https://github.com/wadey/node-microtime) package can be used
which makes system calls to `tv_usec` from C++.

```javascript
"use strict"

const { Client } = require("pg")

const start = async () => {
  const client = new Client({
    database: "qdb",
    host: "127.0.0.1",
    password: "quest",
    port: 8812,
    user: "admin",
  })
  await client.connect()

  const createTable = await client.query(
    "CREATE TABLE IF NOT EXISTS trades (" +
    "    ts TIMESTAMP, date DATE, name STRING, value INT" +
    ") timestamp(ts);",
  )
  console.log(createTable)

  let now = new Date().toISOString()
  const insertData = await client.query(
    "INSERT INTO trades VALUES($1, $2, $3, $4);",
    [now, now, "node pg example", 123],
  )
  await client.query("COMMIT")

  console.log(insertData)

  for (let rows = 0; rows < 10; rows++) {
    // Providing a 'name' field allows for prepared statements / bind variables
    now = new Date().toISOString()
    const query = {
      name: "insert-values",
      text: "INSERT INTO trades VALUES($1, $2, $3, $4);",
      values: [now, now, "node pg prep statement", rows],
    }
    await client.query(query)
  }
  await client.query("COMMIT")

  const readAll = await client.query("SELECT * FROM trades")
  console.log(readAll.rows)

  await client.end()
}

start()
  .then(() => console.log("Done"))
  .catch(console.error)
```

</TabItem>


<TabItem value="go">


This example uses the [pgx](https://github.com/jackc/pgx) driver and toolkit for
PostgreSQL in Go. More details on the use of this toolkit can be found on the
[GitHub repository for pgx](https://github.com/jackc/pgx/wiki/Getting-started-with-pgx).

```go
package main

import (
  "context"
  "fmt"
  "log"
  "time"

  "github.com/jackc/pgx/v4"
)

var conn *pgx.Conn
var err error

func main() {
  ctx := context.Background()
  conn, _ = pgx.Connect(ctx, "postgresql://admin:quest@localhost:8812/qdb")
  defer conn.Close(ctx)

  // text-based query
  _, err := conn.Exec(ctx,
    ("CREATE TABLE IF NOT EXISTS trades (" +
     "    ts TIMESTAMP, date DATE, name STRING, value INT" +
     ") timestamp(ts);"))
  if err != nil {
    log.Fatalln(err)
  }

  // Prepared statement given the name 'ps1'
  _, err = conn.Prepare(ctx, "ps1", "INSERT INTO trades VALUES($1,$2,$3,$4)")
  if err != nil {
    log.Fatalln(err)
  }

  // Insert all rows in a single commit
  tx, err := conn.Begin(ctx)
  if err != nil {
    log.Fatalln(err)
  }

  for i := 0; i < 10; i++ {
    // Execute 'ps1' statement with a string and the loop iterator value
    _, err = conn.Exec(
      ctx,
      "ps1",
      time.Now(),
      time.Now().Round(time.Millisecond),
      "go prepared statement",
      i + 1)
    if err != nil {
      log.Fatalln(err)
    }
  }

  // Commit the transaction
  err = tx.Commit(ctx)
  if err != nil {
    log.Fatalln(err)
  }

  // Read all rows from table
  rows, err := conn.Query(ctx, "SELECT * FROM trades")
  fmt.Println("Reading from trades table:")
  for rows.Next() {
    var name string
    var value int64
    var ts time.Time
    var date time.Time
    err = rows.Scan(&ts, &date, &name, &value)
    fmt.Println(ts, date, name, value)
  }

  err = conn.Close(ctx)
}
```

</TabItem>


<TabItem value="rust">


The following example shows how to use parameterized queries and prepared
statements using the [rust-postgres](https://docs.rs/postgres/0.19.0/postgres/)
client.

```rust
use postgres::{Client, NoTls, Error};
use chrono::{Utc};
use std::time::SystemTime;

fn main() -> Result<(), Error> {
    let mut client = Client::connect("postgresql://admin:quest@localhost:8812/qdb", NoTls)?;

    // Basic query
    client.batch_execute(
      "CREATE TABLE IF NOT EXISTS trades ( \
          ts TIMESTAMP, date DATE, name STRING, value INT \
      ) timestamp(ts);")?;

    // Parameterized query
    let name: &str = "rust example";
    let val: i32 = 123;
    let utc = Utc::now();
    let sys_time = SystemTime::now();
    client.execute(
        "INSERT INTO trades VALUES($1,$2,$3,$4)",
        &[&utc.naive_local(), &sys_time, &name, &val],
    )?;

    // Prepared statement
    let mut txn = client.transaction()?;
    let statement = txn.prepare("INSERT INTO trades VALUES ($1,$2,$3,$4)")?;
    for value in 0..10 {
        let utc = Utc::now();
        let sys_time = SystemTime::now();
        txn.execute(&statement, &[&utc.naive_local(), &sys_time, &name, &value])?;
    }
    txn.commit()?;

    println!("import finished");
    Ok(())
}
```

</TabItem>


<!--

<TabItem value="c">

```c
#include <libpq-fe.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>
#include <string.h>

void do_exit(PGconn* conn)
{
    PQfinish(conn);
    exit(1);
}
int main()
{
    PGconn* conn = PQconnectdb(
        "host=localhost user=admin password=quest port=8812 dbname=qdb");
    if (PQstatus(conn) == CONNECTION_BAD) {
        fprintf(stderr, "Connection to database failed: %s\n",
            PQerrorMessage(conn));
        do_exit(conn);
    }
    // Simple query
    PGresult* res = PQexec(conn,
        "CREATE TABLE IF NOT EXISTS trades (ts TIMESTAMP, name STRING, value INT) timestamp(ts);");
    PQclear(res);

    int i;
    for (i = 0; i < 5; ++i) {
        char timestamp[30];
        char milis[7];
        struct timeval tv;
        time_t curtime;
        gettimeofday(&tv, NULL);
        strftime(timestamp, 30, "%Y-%m-%dT%H:%M:%S.", localtime(&tv.tv_sec));
        snprintf(milis, 7, "%d", tv.tv_usec);
        strcat(timestamp, milis);

        const char* values[1] = { timestamp };
        int lengths[1] = { strlen(timestamp) };
        int binary[1] = { 0 };

        res = PQexecParams(conn,
            "INSERT INTO trades VALUES (to_timestamp($1, 'yyyy-MM-ddTHH:mm:ss.SSSUUU'), 'timestamp', 123);",
            1, NULL, values, lengths, binary, 0);
    }
    res = PQexec(conn, "COMMIT");
    printf("Done\n");
    PQclear(res);
    do_exit(conn);
    return 0;
}
```

```shell title="Compiling the example"
# g++ on win
g++ libpq_example.c -o run_example.exe -I pgsql\include -L dev\pgsql\lib -std=c++17 -lpthread -lpq

# gcc on MacOS with homebrew postgres install
gcc libpq_example.c -o run_example.c -I pgsql/include -L /usr/local/Cellar/postgresql/13.1/lib/postgresql -lpthread -lpq
```

</TabItem>
-->

</Tabs>
