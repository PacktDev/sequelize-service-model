# sequelize-service-model

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

[static] Get Sequelize constructor
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
const links = ServiceModel.generateLinkOptions(paginationOptions);
```

Result will look like:
```
{
    prev: 'https://services.packtpub.com/offers?offset=20&limit=10',
    next: 'https://services.packtpub.com/offers?offset=40&limit=10',
}
```

