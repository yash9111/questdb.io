---
title: Importing from multiple CSV files
sidebar_label: Importing from multiple CSVs
description:
  Sometimes your dataset is split over multiple files, but COPY
  supports a single filename. This page explores possible solutions
---


The ```COPY``` command accepts a single file. However, it might be the case your data has been exported to multiple ```CSV``` files.

You can choose to launch a ```COPY``` command for each file, but since ```COPY``` is asynchronous and doesn't accept multiple operations in parallel, it is probably more convenient to join all the files and run a single ```COPY```.

### Concatenating files without headers

If your ```CSV``` files don't have any headers, you can just concatenate them. If the original files are sorted by designated timestamp, it is a good idea to concatenate in the same order

This is a possible way to concatenate files in alphabetical order in _Linux_ or _Mac_

```
ls *.csv | sort | xargs cat > singleFile.csv
```

And this is a possible way to concatenate files in alphabetical order in _PowerShell_

```
$TextFiles = Get-Item C:\Users\path\to\csv\*.csv
$TextFiles | sort | foreach { Add-Content -Value $(Get-Content $_) -Path C:\Users\path\to\csv\singleFile.csv}
```

### Concatenating files with headers

If your ```CSV``` files have headers, you need to be careful when concatenating. You could manually remove the first line of the files before concatenating, or use some smart command line to concat and remove the headers. Since that can be tricky, a good alternative is using the open source tool [csvstack](https://csvkit.readthedocs.io/en/latest/scripts/csvstack.html).

This is how you can concatenate multiple CSV files using _csvstack_

```
csvstack *.csv > singleFile.csv
```
