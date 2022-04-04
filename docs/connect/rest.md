# HTTP REST API

import Tabs from "@theme/Tabs"
import TabItem from "@theme/TabItem"

QuestDB exposes a REST API for compatibility with a wide range of libraries and
tools. The REST API is accessible on port `9000` and has the following
entrypoints:

|Entrypoint|HTTP Method|Description|API Docs|
|----------|-----------|-----------|--------|
|[`/imp`](#imp-uploading-tabular-data)|POST|Import CSV data|[Reference](/docs/reference/api/rest#imp---import-data)|
|[`/exp?query=..`](#exp-sql-query-to-csv)|GET|Export SQL Query as CSV|[Reference](/docs/reference/api/rest#exp---export-data)|
|[`/exec?query=..`](#exec-sql-query-to-json)|GET|Run SQL Query returning JSON result set|[Reference](/docs/reference/api/rest#exec---execute-queries)|

For details such as content type, query parameters et cetera, refer to the
[REST API](/docs/reference/api/rest) docs.

Here we'll get you started with a few examples in different programming languages.

## `/imp`: Uploading Tabular Data

:::tip

[InfluxDB Line Protocol](ilp) is the recommended primary ingestion method in
QuestDB. CSV uploading offers insert feedback and error reporting, but has worse
overall performance.

See `/imp`'s [`atomicity`](/docs/reference/api/rest#url-parameters) query
parameter to customise behaviour on error.

:::

Let's assume you want to upload the following data via the `/imp` entrypoint:

<Tabs defaultValue="csv" values={[
  { label: "CSV", value: "csv" },
  { label: "Table", value: "table" },
]}>

<TabItem value="csv">

```csv title=data.csv
col1,col2,col3
a,10.5,True
b,100,False
c,,True
```

</TabItem>

<TabItem value="table">

|col1|col2  |col3   |
|----|------|-------|
|a   |10.5  |*true* |
|b   |100   |*false*|
|c   |*NULL*|*true* |

</TabItem>

</Tabs>

You can do so via the command line using `cURL`, or programmatically via HTTP
APIs in your own scripts and applications:

<Tabs defaultValue="curl" values={[
  { label: "cURL", value: "curl" },
  { label: "Python", value: "python" },
  { label: "NodeJS", value: "nodejs" },
  { label: "Go", value: "go" },
]}>

<TabItem value="curl">


This example imports a CSV file with automatic schema detection.

```shell title="Basic import"
curl -F data=@data.csv http://localhost:9000/imp
```

This example overwrites an existing table, specifies a timestamp format and a
designated timestamp column. For more information on the optional parameters for
specifying timestamp formats, partitioning and renaming tables, see the
[REST API documentation](/docs/reference/api/rest#examples).

```bash title="Providing a user-defined schema"
curl \
-F schema='[{"name":"ts", "type": "TIMESTAMP", "pattern": "yyyy-MM-dd - HH:mm:ss"}]' \
-F data=@weather.csv 'http://localhost:9000/imp?overwrite=true&timestamp=ts'
```

</TabItem>


<TabItem value="python">

This first example shows uploading the `data.csv` file with automatic schema
detection.

```python
import sys
import requests

csv = {'data': ('my_table', open('./data.csv', 'r'))}
host = 'http://localhost:9000'

try:
    response = requests.post(host + '/imp', files=csv)
    print(response.text)
except requests.exceptions.RequestException as e:
    print(f'Error: {e}', file=sys.stderr)
```

The second example creates a CSV buffer from Python objects and uploads them
with a custom schema. Note UTF-8 encoding.

The `fmt=json` parameter allows us to obtain a parseable response, rather than a
tabular response designed for human consumption.

```python
import io
import csv
import requests
import pprint
import json


def to_csv_str(table):
    output = io.StringIO()
    csv.writer(output, dialect='excel').writerows(table)
    return output.getvalue().encode('utf-8')


def main():
    table_name = 'example_table2'
    table = [
        ['col1', 'col2', 'col3'],
        ['a',    10.5,   True],
        ['b',    100,    False],
        ['c',    None,   True]]

    table_csv = to_csv_str(table)
    print(table_csv)
    schema = json.dumps([
        {'name': 'col1', 'type': 'SYMBOL'},
        {'name': 'col2', 'type': 'DOUBLE'},
        {'name': 'col3', 'type': 'BOOLEAN'}])
    response = requests.post(
        'http://localhost:9000/imp',
        params={'fmt': 'json'},
        files={
            'schema': schema,
            'data': (table_name, table_csv)}).json()

    # You can parse the `status` field and `error` fields
    # of individual columns. See Reference/API/REST docs for details.
    pprint.pprint(response)


if __name__ == '__main__':
    main()
```

</TabItem>

<TabItem value="nodejs">


```javascript
const fetch = require("node-fetch")
const FormData = require("form-data")
const fs = require("fs")
const qs = require("querystring")

const HOST = "http://localhost:9000"

async function run() {
  const form = new FormData()

  form.append("data", fs.readFileSync(__dirname + "/data.csv"), {
    filename: fileMetadata.name,
    contentType: "application/octet-stream",
  })

  try {
    const r = await fetch(`${HOST}/imp`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    })

    console.log(r)
  } catch (e) {
    console.error(e)
  }
}

run()
```

</TabItem>

<TabItem value="go">


```go
package main

import (
  "bytes"
  "fmt"
  "io"
  "io/ioutil"
  "log"
  "mime/multipart"
  "net/http"
  "net/url"
  "os"
)

func main() {
  u, err := url.Parse("http://localhost:9000")
  checkErr(err)
  u.Path += "imp"
  url := fmt.Sprintf("%v", u)
  fileName := "/path/to/data.csv"
  file, err := os.Open(fileName)
  checkErr(err)

  defer file.Close()

  buf := new(bytes.Buffer)
  writer := multipart.NewWriter(buf)
  uploadFile, _ := writer.CreateFormFile("data", "data.csv")
  _, err = io.Copy(uploadFile, file)
  checkErr(err)
  writer.Close()

  req, err := http.NewRequest(http.MethodPut, url, buf)
  checkErr(err)
  req.Header.Add("Content-Type", writer.FormDataContentType())

  client := &http.Client{}
  res, err := client.Do(req)
  checkErr(err)

  defer res.Body.Close()

  body, err := ioutil.ReadAll(res.Body)
  checkErr(err)

  log.Println(string(body))
}

func checkErr(err error) {
  if err != nil {
    panic(err)
  }
}
```

</TabItem>

</Tabs>

## `/exp`: SQL Query to CSV

The `/exp` entrypoint allows querying the database with a SQL select query and
obtaining the results as CSV.

For obtaining results in JSON, use `/exec` instead, documented next.

<Tabs defaultValue="curl" values={[
  { label: "cURL", value: "curl" },
  { label: "Python", value: "python" },
]}>

<TabItem value="curl">

```bash
curl -G --data-urlencode "query=select * from example_table2 limit 3" http://localhost:9000/exp
```

```csv
"col1","col2","col3"
"a",10.5,true
"b",100.0,false
"c",,true
```

</TabItem>

<TabItem value="python">

```python
import requests

resp = requests.get(
    'http://localhost:9000/exp',
    {
        'query': 'select * from example_table2',
        'limit': '3,6'   # Rows 3, 4, 5
    })
print(resp.text)
```

```csv
"col1","col2","col3"
"d",20.5,true
"e",200.0,false
"f",,true
```

</TabItem>

</Tabs>

## `/exec`: SQL Query to JSON

The `/exec` entrypoint takes a SQL query and returns results as JSON.

This is similar to the `/exec` entry point which returns results as CSV.

### Querying Data

<Tabs defaultValue="curl" values={[
  { label: "cURL", value: "curl" },
  { label: "Python", value: "python" },
  { label: "NodeJS", value: "nodejs" },
  { label: "Go", value: "go" },
]}>

<!-- prettier-ignore-end -->

<TabItem value="curl">


```shell
curl -G \
  --data-urlencode "query=SELECT x FROM long_sequence(5);" \
  http://localhost:9000/exec
```

The JSON response contains the original query, a `"columns"` key with the schema
of the results, a `"count"` number of rows and a `"dataset"` with the results.

```json
{
    "query": "SELECT x FROM long_sequence(5);",
    "columns": [
        {"name": "x", "type": "LONG"}],
    "dataset": [
        [1],
        [2],
        [3],
        [4],
        [5]],
    "count": 5
}
```

</TabItem>


<TabItem value="python">


```python
import sys
import requests

host = 'http://localhost:9000'

sql_query = "select * from long_sequence(10)"

try:
    response = requests.get(
        host + '/exec',
        params={'query': sql_query}).json()
    for row in response['dataset']:
        print(row[0])
except requests.exceptions.RequestException as e:
    print(f'Error: {e}', file=sys.stderr)
```

</TabItem>


<TabItem value="nodejs">


```javascript
const fetch = require("node-fetch")
const qs = require("querystring")

const HOST = "http://localhost:9000"

async function run() {
  try {
    const queryData = {
      query: "SELECT x FROM long_sequence(5);",
    }

    const response = await fetch(`${HOST}/exec?${qs.encode(queryData)}`)
    const json = await response.json()

    console.log(json)
  } catch (error) {
    console.log(error)
  }
}

run()
```

</TabItem>


<TabItem value="go">


```go
package main

import (
  "fmt"
  "io/ioutil"
  "log"
  "net/http"
  "net/url"
)

func main() {
  u, err := url.Parse("http://localhost:9000")
  checkErr(err)

  u.Path += "exec"
  params := url.Values{}
  params.Add("query", "SELECT x FROM long_sequence(5);")
  u.RawQuery = params.Encode()
  url := fmt.Sprintf("%v", u)

  res, err := http.Get(url)
  checkErr(err)

  defer res.Body.Close()

  body, err := ioutil.ReadAll(res.Body)
  checkErr(err)

  log.Println(string(body))
}

func checkErr(err error) {
  if err != nil {
    panic(err)
  }
}
```

</TabItem>


</Tabs>


### Inserting Data

Note that the `/exec` entry point can also execute SQL `insert` statements.

:::tip

[InfluxDB Line Protocol](ilp) is the recommended primary ingestion method in
QuestDB. SQL `insert` statements offer feedback and error reporting, but have
worse overall performance.

:::

<Tabs defaultValue="curl" values={[
  { label: "cURL", value: "curl" },
  { label: "Python", value: "python" },
  { label: "NodeJS", value: "nodejs" },
  { label: "Go", value: "go" },
]}>

<TabItem value="curl">


```shell
# Create Table
curl -G \
  --data-urlencode "query=CREATE TABLE IF NOT EXISTS trades(name STRING, value INT)" \
  http://localhost:9000/exec

# Insert a row
curl -G \
  --data-urlencode "query=INSERT INTO trades VALUES('abc', 123456)" \
  http://localhost:9000/exec
```

</TabItem>


<TabItem value="python">


```python
import sys
import requests
import json

host = 'http://localhost:9000'

def run_query(sql_query):
    query_params = {'query': sql_query, 'fmt' : 'json'}
    try:
        response = requests.get(host + '/exec', params=query_params)
        json_response = json.loads(response.text)
        print(json_response)
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}', file=sys.stderr)

# create table
run_query("CREATE TABLE IF NOT EXISTS trades (name STRING, value INT)")
# insert row
run_query("INSERT INTO trades VALUES('abc', 123456)")
```

</TabItem>


<TabItem value="nodejs">


The `node-fetch` package can be installed using `npm i node-fetch`.

```javascript
const fetch = require("node-fetch")
const qs = require("querystring")

const HOST = "http://localhost:9000"

async function createTable() {
  try {
    const queryData = {
      query: "CREATE TABLE IF NOT EXISTS trades (name STRING, value INT)",
    }

    const response = await fetch(`${HOST}/exec?${qs.encode(queryData)}`)
    const json = await response.json()

    console.log(json)
  } catch (error) {
    console.log(error)
  }
}

async function insertData() {
  try {
    const queryData = {
      query: "INSERT INTO trades VALUES('abc', 123456)",
    }

    const response = await fetch(`${HOST}/exec?${qs.encode(queryData)}`)
    const json = await response.json()

    console.log(json)
  } catch (error) {
    console.log(error)
  }
}

createTable()
insertData()
```

</TabItem>


<TabItem value="go">


```go
package main

import (
  "fmt"
  "io/ioutil"
  "log"
  "net/http"
  "net/url"
)

func main() {
  u, err := url.Parse("http://localhost:9000")
  checkErr(err)

  u.Path += "exec"
  params := url.Values{}
  params.Add("query", `
    CREATE TABLE IF NOT EXISTS
      trades (name STRING, value INT);
    INSERT INTO
      trades
    VALUES(
      "abc",
      123456
    );
  `)
  u.RawQuery = params.Encode()
  url := fmt.Sprintf("%v", u)

  res, err := http.Get(url)
  checkErr(err)

  defer res.Body.Close()

  body, err := ioutil.ReadAll(res.Body)
  checkErr(err)

  log.Println(string(body))
}

func checkErr(err error) {
  if err != nil {
    panic(err)
  }
}
```

</TabItem>

</Tabs>