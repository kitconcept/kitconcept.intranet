---
myst:
  html_meta:
    "description": "Move/Rename content objects via an instance script"
    "property=og:description": "Move/Rename content objects via an instance script"
    "property=og:title": "Move/Rename content objects via an instance script"
    "keywords": "kitconcept Intranet Distribution, moving content objects, renaming content objects, instance script"
---

# Move/Rename content objects via an instance script

This document describes how to run the `move_rename_object.py` instance script locally or inside a Docker container.

This is useful in cases where a lot of content needs to be reindexed, and running the operation inside a request would time out.

| Option            | Description                                                         |
|-------------------|---------------------------------------------------------------------|
| OLD_ID (required) | Absolute path to existing content object (without /Plone).          |
| NEW_ID (required) | Absolute path where to move the content object to (without /Plone). |

## Usage

### Docker

```bash
$ OLD_ID=/foo/bar NEW_ID=/foo/bas \
  ./docker-entrypoint.sh run scripts/move_rename_object.py
```

### Locally

```bash
$ OLD_ID=/foo/bar NEW_ID=/foo/bas \
  .venv/bin/zconsole run scripts/move_rename_object.py
```

## Examples

### Moving a content object

```bash
$ OLD_ID=/foo/bar NEW_ID=/bar \
  ./docker-entrypoint.sh run scripts/move_rename_object.py
```

### Renaming a content object

```bash
$ OLD_ID=/foo/bar NEW_ID=/foo/bas \
  ./docker-entrypoint.sh run scripts/move_rename_object.py
```
