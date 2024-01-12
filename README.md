# kitconcept.intranet

A Plone distribution for Intranets with Plone. Created by kitconcept.

## Features

### Content Types

- TBD

### Initial content

This package contains a simple volto configuration.

Installation
------------

Install kitconcept.intranet with `pip`:

```shell
pip install kitconcept.intranet
```
And to create the Plone site:

```shell
make create_site
```

## Development

### Backend

````
git clone git@github.com:kitconcept/kitconcept.intranet.git
cd kitconcept.intranet
make
make start
-> go to localhost:8080 and create a new kitconcept.intranet instance with example content
````

### Frontend

````
git clone git@github.com:kitconcept/kitconcept-intranet.git
cd kitconcept-intranet
make
make start
-> go to localhost:3000 to see the Volto frontend
````

### Solr

````
export PLONE_VERSION=6.0.9 && make build-image
make solr-prepare
make solr-start
-> go to localhost:8983/solr to see the Solr backend
````

## Contribute

- [Issue Tracker](https://github.com/kitconcept/kitconcept.intranet/issues)
- [Source Code](https://github.com/kitconcept/kitconcept.intranet/)

## License

The project is licensed under GPLv2.
