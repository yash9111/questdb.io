---
title: Get started with QuestDB from the binaries
sidebar_label: Binaries
description:
  How to install and launch QuestDB from the binaries which are available on the
  Get QuestDB page.
---

import CodeBlock from "@theme/CodeBlock"
import InterpolateReleaseData from "../../src/components/InterpolateReleaseData"
import { getAssets } from "../../src/utils/get-assets"
import Tabs from "@theme/Tabs"
import TabItem from "@theme/TabItem"

export const platforms = [
  { label: "Any (no JVM)", value: "noJre" },
  { label: "Linux", value: "linux" },
  { label: "FreeBSD", value: "bsd" },
  { label: "Windows", value: "windows" },
]

This page describes how to download and run QuestDB via binaries. QuestDB comes
with a `questdb.sh` script on Linux or FreeBSD, and a `questdb.exe` executable
on Windows. For macOS, check out [Homebrew](/docs/get-started/homebrew).

## Prerequisites

### Java 11

You need to have Java 11 installed locally. To check your installed version:

```shell
java -version
```

If you do not have Java installed, install one of the following supported
packages for your operating system:

- AdoptOpenJDK
- Amazon Corretto
- OpenJDK
- Oracle Java

Other Java distributions might work but are not tested.

#### `JAVA_HOME`

The environment variable `JAVA_HOME` needs to point to your Java 11 installation
folder.

## Download the binaries

<!-- prettier-ignore-start -->

<Tabs
  defaultValue="noJre"
  values={platforms}
>
  {platforms.map((platform) => (
    <TabItem key={platform} value={platform.value}>
      <InterpolateReleaseData
        renderText={(release) => {
          const assets = getAssets(release)
          const href = assets[platform.value].href
          return (
            <a href={href} rel="noopener noreferrer" target="_blank">
              {href.split("/").reverse()[0]}
            </a>
          )
        }}
      />
    </TabItem>
  ))}
</Tabs>

<!-- prettier-ignore-end -->

The Java runtime is packaged directly with QuestDB and you do not need anything
else.

## Extract the tarballs

<!-- prettier-ignore-start -->

<Tabs defaultValue="noJre" values={platforms}>
  {platforms.map((platform) => (
    <TabItem key={platform} value={platform.value}>
      <InterpolateReleaseData
        renderText={(release) => {
          const assets = getAssets(release)
          const href = assets[platform.value].href
          return (
            <CodeBlock className="language-shell">
              {`tar -xvf ${href.split("/").reverse()[0]}`}
            </CodeBlock>
          )
        }}
      />
    </TabItem>
  ))}
</Tabs>

<!-- prettier-ignore-end -->

## Run QuestDB

<!-- prettier-ignore-start -->

<Tabs defaultValue="nix"
values={[
  { label: "Linux/FreeBSD", value: "nix" },
  { label: "Windows", value: "windows" }
]}>

<!-- prettier-ignore-end -->

<TabItem value="nix">


```shell
./questdb.sh start
```

</TabItem>


<TabItem value="windows">


```shell
-- To run the instance as a windows service (preferably as a privileged account):
questdb.exe install
questdb.exe start

-- To run a one-off instance in the current work directory:

questdb.exe
```

</TabItem>


</Tabs>


### Upgrade QuestDB version

:::note

Check the [release notes](https://github.com/questdb/questdb/releases) and
ensure that necessary [backup](/docs/operations/backup/) is completed.

:::

Steps to upgrade the QuestDB version: 

- Stop the instance
- Overwrite the `bin` and `lib` folders with the new files
- Restart the instance

<!-- prettier-ignore-start -->

<Tabs defaultValue="nix"
values={[
  { label: "Linux/FreeBSD", value: "nix" },
  { label: "Windows", value: "windows" }
]}>

<!-- prettier-ignore-end -->

<TabItem value="nix">


```shell
./questdb.sh stop

(Overwrite `bin` and `lib` folders with the new files)

./questdb.sh start
```

</TabItem>


<TabItem value="windows">


```shell
questdb.exe stop

(Overwrite `bin` and `lib` folders with the new files)

questdb.exe start
```

</TabItem>


</Tabs>


## Next steps

Once you extracted the tarball, you are ready to use QuestDB. Navigate to our
[command-line options](/docs/reference/command-line-options) page to learn more
about its usage.
