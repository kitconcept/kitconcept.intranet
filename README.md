# Installation

Install Node 20:

```
nvm install 20
nvm use 20
```

Enable Coremedia:

```
corepack enable pnpm
```

Build:

```
make install
```

Build Solr:

```
make solr-prepare
make solr-start-and-rebuild
```

# Start

Start Frontend:

```
cd frontend && pnpm start
```

Start Backend

```
make start-backend
```

Start Solr:

```
make start-solr
```

# Export

Export content to the file system:

```
make export
```
