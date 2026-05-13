---
myst:
  html_meta:
    "description": "Reindexing content via an instance script"
    "property=og:description": "Reindexing content via an instance script"
    "property=og:title": "Reindexing content via an instance script"
    "keywords": "kitconcept Intranet Distribution, reindexing content, instance script"
---

# Reindexing content via an instance script

This document describes how to run the `reindex_content.py` instance script locally or inside a Docker container.

This is useful in cases where a lot of content needs to be reindexed, and running the operation inside a request would time out.

| Option                 | Description                                                   |
|------------------------|---------------------------------------------------------------|
| INDEXES (required)     | Comma-separated list of catalog indexes to reindex.           |
| PORTAL_TYPE (optional) | Comma-separated list of portal types to limit the reindexing. |

## Usage

### Docker

```bash
$ PORTAL_TYPE=<portal_type> INDEXES=<indexes> \
  ./docker-entrypoint.sh run scripts/reindex_content.py
```

### Locally

```bash
$ PORTAL_TYPE=<portal_type> INDEXES=<indexes> \
  .venv/bin/zconsole run scripts/reindex_content.py
```

## Examples

### Reindex `Title` and `sortable_title` for one type

```bash
$ PORTAL_TYPE=Contact INDEXES=Title,sortable_title \
  ./docker-entrypoint.sh run scripts/reindex_content.py
```

### Reindex `SearchableText` for multiple types

(The types need to be inside quotation marks if they include spaces.)

```bash
$ PORTAL_TYPE="Document,News Item" INDEXES=SearchableText \
  ./docker-entrypoint.sh run scripts/reindex_content.py
```

### Reindex an index for all types

```bash
$ INDEXES=modified ./docker-entrypoint.sh run scripts/reindex_content.py
```
