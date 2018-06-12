/* eslint-env node, mocha */
/* eslint no-undef: 1 */
/* eslint-disable import/no-extraneous-dependencies */

import Sequelize from 'sequelize';
import { expect } from 'chai';
import ServiceModel from '../src/lib/service-model';

const credentialsObject = {
  dbName: 'testDatabase',
  dbUser: 'circleci',
  dbPass: 'defaultPassword',
  dbHost: 'localhost',
};

const invalidCredentialsObject = {
  dbName: 'testDb',
  dbUser: 'wrongUser',
  dbPass: 'wrongPassword',
  dbHost: 'localhost',
};

describe('Service Model', () => {
  describe('Constructing the instance', () => {
    it('Creates a db instance with a valid config', () => {
      const serviceModel = new ServiceModel(credentialsObject);

      expect(serviceModel.db).to.be.instanceof(Object);
      expect(serviceModel.db.options.dialect).to.be.eql('postgres');

      serviceModel.closeDb();
    });

    it('Creates a db instance with an invalid config', () => {
      const serviceModel = new ServiceModel(invalidCredentialsObject);

      expect(serviceModel.db).to.be.instanceof(Object);
      expect(serviceModel.db.options.dialect).to.be.eql('postgres');

      serviceModel.closeDb();
    });

    it('Should not create a db instance when missing DB name parameter', () => {
      const credentials = {
        dbUser: 'testName',
        dbPass: 'testPass',
        dbHost: 'localhost',
      };
      expect(() => new ServiceModel(credentials)).to.throw('Invalid DB credentials');
    });

    it('Should not create a db instance when missing DB user parameter', () => {
      const credentials = {
        dbName: 'testDb',
        dbPass: 'testPass',
        dbHost: 'localhost',
      };
      expect(() => new ServiceModel(credentials)).to.throw('Invalid DB credentials');
    });

    it('Should not create a db instance when missing DB password parameter', () => {
      const credentials = {
        dbName: 'testDb',
        dbUser: 'testName',
        dbHost: 'localhost',
      };
      expect(() => new ServiceModel(credentials)).to.throw('Invalid DB credentials');
    });

    it('Should not create a db instance when missing DB host parameter', () => {
      const credentials = {
        dbName: 'testDb',
        dbUser: 'testName',
        dbPass: 'testPass',
      };
      expect(() => new ServiceModel(credentials)).to.throw('Invalid DB credentials');
    });
  });

  describe('Getting a DB connection', () => {
    it('Calling getDb returns a Sequelize DB instance', () => {
      const serviceModel = new ServiceModel(credentialsObject);
      const db = serviceModel.getDb();

      expect(db).to.be.instanceof(Object);
      expect(db.options.dialect).to.be.eql('postgres');

      serviceModel.closeDb();
    });
  });

  describe('Checking a DB connection', () => {
    let serviceModel;
    let serviceModel2;
    /**
      * Hooks
      */
    beforeEach(() => {
      serviceModel = new ServiceModel(credentialsObject);
      serviceModel2 = new ServiceModel(invalidCredentialsObject);
    });
    afterEach(() => {
      serviceModel.closeDb();
      serviceModel2.closeDb();
    });

    it('Calling checkDbConnectivity with correct credentials', (done) => {
      serviceModel.checkDbConnectivity()
        .then(() => {
          done();
        });
    });

    it('Calling checkDbConnectivity with incorrect credentials should return error', (done) => {
      serviceModel2.checkDbConnectivity()
        .catch((error) => {
          expect(error.message).to.be.eql('Unable to connect to the database');
          done();
        });
    });
  });

  describe('Closing a DB connection', () => {
    it('Calls closeDb to close all connections used by this sequelize instance', () => {
      const serviceModel = new ServiceModel(credentialsObject);
      serviceModel.closeDb();
    });
  });

  describe('Generate pagination links', () => {
    it('Should throw if count missing', () => {
      const paginationObject = {
        offset: 2,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      expect(() => ServiceModel.generatePaginationLinks(paginationObject))
        .to.throw('Please provide valid pagination options.');
    });

    it('Should throw if count not a number', () => {
      const paginationObject = {
        count: '53',
        offset: 2,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      expect(() => ServiceModel.generatePaginationLinks(paginationObject))
        .to.throw('Please provide valid pagination options.');
    });

    it('Should throw if limit missing', () => {
      const paginationObject = {
        count: 53,
        offset: 2,
        baseLink: 'https://services.packpub.com/offers',
      };

      expect(() => ServiceModel.generatePaginationLinks(paginationObject))
        .to.throw('Please provide valid pagination options.');
    });

    it('Should throw if limit not a number', () => {
      const paginationObject = {
        count: 53,
        offset: 2,
        limit: '1234',
        baseLink: 'https://services.packpub.com/offers',
      };

      expect(() => ServiceModel.generatePaginationLinks(paginationObject))
        .to.throw('Please provide valid pagination options.');
    });

    it('Should throw if limit=0', () => {
      const paginationObject = {
        count: 53,
        offset: 10,
        limit: 0,
        baseLink: 'https://services.packpub.com/offers',
      };

      expect(() => ServiceModel.generatePaginationLinks(paginationObject))
        .to.throw('Please provide valid pagination options.');
    });


    it('Should throw if offset not a number', () => {
      const paginationObject = {
        count: 53,
        offset: false,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      expect(() => ServiceModel.generatePaginationLinks(paginationObject))
        .to.throw('Please provide valid pagination options.');
    });


    it('Should default to offset=0 if offset param missing', () => {
      const paginationObject = {
        count: 53,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      const links = ServiceModel.generatePaginationLinks(paginationObject);
      expect(links.prev).to.be.undefined;
      expect(links.next).to.equal('https://services.packpub.com/offers?offset=10&limit=10');
    });

    it('Should throw if baseLink missing', () => {
      const paginationObject = {
        count: 53,
        offset: 2,
        limit: 10,
      };

      expect(() => ServiceModel.generatePaginationLinks(paginationObject))
        .to.throw('Please provide valid pagination options.');
    });

    it('Should throw if baseLink not an https url-like string', () => {
      const paginationObject = {
        count: 53,
        offset: 2,
        limit: 10,
        baseLink: 'abc',
      };

      expect(() => ServiceModel.generatePaginationLinks(paginationObject))
        .to.throw('Please provide valid pagination options.');
    });

    it('Should not return next for count < limit and offset < limit', () => {
      const paginationObject = {
        count: 5,
        offset: 1,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      const links = ServiceModel.generatePaginationLinks(paginationObject);
      expect(links.next).to.be.undefined;
    });

    it('Should return prev if offset >= 1 and there are results', () => {
      const paginationObject = {
        count: 5,
        offset: 1,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      const links = ServiceModel.generatePaginationLinks(paginationObject);
      expect(links.prev).to.equal('https://services.packpub.com/offers?offset=0&limit=10');
    });

    it('Should not return prev or next if there are no results', () => {
      const paginationObject = {
        count: 0,
        offset: 1,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      const links = ServiceModel.generatePaginationLinks(paginationObject);
      expect(links.prev).to.be.undefined;
      expect(links.next).to.be.undefined;
    });

    it('should return both previous and next properties when not on first or last page', () => {
      const paginationObject = {
        count: 53,
        offset: 12,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      const links = ServiceModel.generatePaginationLinks(paginationObject);
      expect(links.prev).to.equal('https://services.packpub.com/offers?offset=2&limit=10');
      expect(links.next).to.equal('https://services.packpub.com/offers?offset=22&limit=10');
    });

    it('Should return only previous page if on last page', () => {
      const paginationObject = {
        count: 23,
        offset: 20,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      const links = ServiceModel.generatePaginationLinks(paginationObject);
      expect(links.prev).to.equal('https://services.packpub.com/offers?offset=10&limit=10');
      expect(links.next).to.be.undefined;
    });

    it('Should return only next page if on the first page', () => {
      const paginationObject = {
        count: 23,
        offset: 0,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      const links = ServiceModel.generatePaginationLinks(paginationObject);
      expect(links.prev).to.be.undefined;
      expect(links.next).to.equal('https://services.packpub.com/offers?offset=10&limit=10');
    });
  });

  describe('Get Sequelize Constructor', () => {
    it('Should return the Sequelize constructor', () => {
      const sequelizeConstructor = ServiceModel.getSequelize();
      expect(sequelizeConstructor).to.equal(Sequelize);
    });
  });

  describe('jsonParse', () => {
    it('Should return the parsed JSON', (done) => {
      const validJson = '{"message": "test"}';
      ServiceModel.jsonParse(validJson)
        .then((body) => {
          expect(body).to.be.instanceof(Object);
          expect(body.message).to.equal('test');
          done();
        });
    });

    it('Should return an error with default statusCode and errorCode', (done) => {
      const validJson = '{"message": "test"';
      ServiceModel.jsonParse(validJson)
        .catch((err) => {
          expect(err.message).to.equal('Invalid json input');
          expect(err.statusCode).to.equal(400);
          expect(err.errorCode).to.equal(1000300);
          done();
        });
    });

    it('Should return an error with custom statusCode and errorCode', (done) => {
      const validJson = '{"message": "test"';
      ServiceModel.jsonParse(validJson, 500, 1000)
        .catch((err) => {
          expect(err.message).to.equal('Invalid json input');
          expect(err.statusCode).to.equal(500);
          expect(err.errorCode).to.equal(1000);
          done();
        });
    });
  });
});

