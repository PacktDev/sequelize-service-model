# sequelize-service-model

[![Greenkeeper badge](https://badges.greenkeeper.io/PacktDev/sequelize-service-model.svg)](https://greenkeeper.io/)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Requirements

* Nodejs >= 8.10
* Docker > 18

## Publish

In order to publish the package and pass all the tests, you need to run `docker-compose up` to launch the postgres DB and in a separate window run `npm publish`. This will run the lint, tests and build the module.

## Example

Importing the module
```
import ServiceModel from '@packt/sequelize-service-model`
```

Get a new service instance
```
const serviceModel = new ServiceModel(dbConfig);
```

[static] Validate a db config
```
const isConfigValid = ServiceModel.isValidDbConfig(dbConfig);
```


**Once you create a new instance of the ServiceModel, internally it will instatiate a new DB instance.**

Get the db instance
```
const db = serviceModel.getDb();
```

Close the db connection
```
serviceModel.closeDb();
```

Check db connectivity
```
serviceModel.checkDbConnectivity()
    .then(...)
```

[static] Get Sequelize Object (the library)
```
const Sequelize = ServiceModel.getSequelize();
```

[static] Get pagination links (next, prev)
```
const paginationOptions = {
    count - Required. Total number of results
    offset -  Optional, defaults to 0. The results offset currently being accessed
    limit - Required. The size of one page
    baseLink - Required. Link to the endpoint that needs pagination. Ex: https://services.packtpub.com/offers
};
const links = ServiceModel.generatePaginationLinks(paginationOptions);
```

Result will look like:
```
{
    prev: 'https://services.packtpub.com/offers?offset=20&limit=10',
    next: 'https://services.packtpub.com/offers?offset=40&limit=10',
}
```

[static] JSON parse
```
import ServiceModel from '@packt/sequelize-service-model';
ServiceModel.jsonParse(body, [statusCode], [errorCode])
    .then(body => do stuff);
```

OR

```
import jsonParse from '@packt/sequelize-service-model/jsonParse';
jsonParse(body, [statusCode], [errorCode])
    .then(body => do stuff);
```

### dbConfig

The service model has beem built with postgres in mind. The default config looks similar to:
```
{
    dbName: 'databaseName',
    dbUser: 'postgres_user',
    dbPass: 'XXXXXX',
    dbHost: 'https://postgreslocation:6543'
}
```

This has also been extended to include sending audit logs of user interactions with the database. To use this feature you need to provide the users UUID and the URI for the ElasticSearch instance. The configuration object would look like:
```
{
    # Postgres Configuration
    dbName: 'databaseName',
    dbUser: 'postgres_user',
    dbPass: 'XXXXXX',
    dbHost: 'https://postgreslocation:6543',
    # Audit Log Configuration
    auditEs: `https://localhost:9200',
    userId: '9301bb15-b070-4e62-8f38-5fdae5a05678',
}
```

Auditing is run on creative or destructive query types, this means we log CREATE, UPDATE & DELETE (soft or hard) queries. The logged object itself will look like:
```
    userId: 'XXXX-XXXX-XXXX-XXXX',
    queryType: 'CREATE|UPDATE|DELETE',
    query: '<QUERY-RELATED-DATA>',
```
