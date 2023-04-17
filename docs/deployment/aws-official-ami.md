---
title: Launch the official QuestDB AMI via the AWS Marketplace
sidebar_label: AWS Marketplace AMI
description:
  This document describes how to launch the official AWS Marketplace AMI with
  QuestDB installed and how to access and secure the instance on Amazon Web
  Services
---
import InterpolateReleaseData from "../../src/components/InterpolateReleaseData"
import CodeBlock from "@theme/CodeBlock"


AWS Marketplace is a digital catalog with software listings from independent
software vendors that runs on AWS. This guide describes how to launch QuestDB
via the AWS Marketplace using the official listing. This document also describes
usage instructions after you have launched the instance, including hints for
authentication, the available interfaces, and tips for accessing the REST API
and web console.

## Prerequisites

- An [Amazon Web Services](https://console.aws.amazon.com) account

## Launching QuestDB on the AWS Marketplace

The QuestDB listing can be found in the AWS Marketplace under the databases
category. To launch a QuestDB instance:

1. Navigate to the
   [QuestDB listing](https://aws.amazon.com/marketplace/search/results?searchTerms=questdb)
2. Click **Continue to Subscribe** and subscribe to the offering
3. **Configure** a version, an AWS region and click **Continue to** **Launch**
4. Choose an instance type and network configuration and click **Launch**

An information panel displays the ID of the QuestDB instance with launch
configuration details and hints for locating the instance in the EC2 console.

## QuestDB configuration

The server configuration file is at the following location on the AMI:

```bash
/var/lib/questdb/conf/server.conf
```

For details on the server properties and using this file, see the
[server configuration documentation](/docs/reference/configuration).

The default ports used by QuestDB interfaces are as follows:

- Web console &amp; REST API is available on port `9000`
- PostgreSQL wire protocol available on `8812`
- InfluxDB line protocol `9009` (TCP and UDP)
- Health monitoring &amp; Prometheus `/metrics` `9003`

### Postgres credentials

Generated credentials can found in the server configuration file:

```bash
/var/lib/questdb/conf/server.conf
```

The default Postgres username is `admin` and a password is randomly generated
during startup:

```ini
pg.user=admin
pg.password=...
```

### InfluxDB line protocol credentials

The credentials for InfluxDB line protocol can be found at

```bash
/var/lib/questdb/conf/full_auth.json
```

For details on authentication using this protocol, see the
[InfluxDB line protocol authentication guide](/docs/reference/api/ilp/authenticate).

### Disabling authentication

If you would like to disable authentication for Postgres wire protocol or
InfluxDB line protocol, comment out the following lines in the server
configuration file:

```ini title="/var/lib/questdb/conf/server.conf"
# pg.password=...

# line.tcp.auth.db.path=conf/auth.txt
```

### Disabling interfaces

Interfaces may be **disabled completely** with the following configuration:

```ini title="/var/lib/questdb/conf/server.conf"
# disable postgres
pg.enabled=false

# disable InfluxDB line protocol over TCP and UDP
line.tcp.enabled=false
line.udp.enabled=false

# disable HTTP (web console and REST API)
http.enabled=false
```

The HTTP interface may alternatively be set to **readonly**:

```ini title="/var/lib/questdb/conf/server.conf"
# set HTTP interface to readonly
http.security.readonly=true
```

## Upgrading QuestDB

:::note

- Check the [release notes](https://github.com/questdb/questdb/releases) and
  ensure that necessary [backup](/docs/operations/backup/) is completed.

:::

You can perform the following steps to upgrade your QuestDB version on an official AWS QuestDB AMI:

- Stop the service:

```shell
systemctl stop questdb.service
```

- Download and copy over the new binary

<InterpolateReleaseData
  renderText={(release) => (
    <CodeBlock className="language-shell">
      {`wget https://github.com/questdb/questdb/releases/download/${release.name}/questdb-${release.name}-no-jre-bin.tar.gz \\
tar xzvf questdb-${release.name}-no-jre-bin.tar.gz
cp questdb-${release.name}-no-jre-bin/questdb.jar /usr/local/bin/questdb.jar
cp questdb-${release.name}-no-jre-bin/questdb.jar /usr/local/bin/questdb-${release.name}.jar`}
    </CodeBlock>
  )}
/>

- Restart the service again:

```shell
systemctl restart questdb.service
systemctl status questdb.service
```
  
  Some troubleshooting tips:
  
1.Check the EC2 Instance Status: Make sure that the instance hosting QuestDB is in a running state and has passed its health checks. If the instance is stopped or failed, you may need to restart it or troubleshoot the underlying issues.

2.Check Security Group Rules: Verify that the security group rules allow the desired traffic to access the QuestDB instance. You can check the inbound and outbound rules configured for the security group in the AWS console.

3.Check Firewall Rules: Verify that the firewall rules on the instance or the network allow the desired traffic to reach the QuestDB instance. You can check the firewall configuration on the instance or network by using the appropriate tools.

4.Check QuestDB Logs: Check the QuestDB logs to see if there are any error messages or warnings that can provide more insight into the issue. The logs are located at /var/log/questdb/questdb.log by default.

5.Check System Logs: Check the system logs on the instance to see if there are any issues related to networking, disk space, memory, or other resources that can cause issues with QuestDB.

6.Check QuestDB Configuration: Verify that the QuestDB configuration file is correct and has the necessary settings for your use case. You can find the configuration file at /var/lib/questdb/conf/server.conf by default.

7.Check QuestDB Processes: Verify that the QuestDB processes are running correctly and have the necessary resources. You can check the process status by using the appropriate tools for your operating system.

8.Check QuestDB Documentation: Check the QuestDB documentation and user forums for known issues, troubleshooting tips, and best practices. You can also reach out to the QuestDB community for support and guidance.
  
