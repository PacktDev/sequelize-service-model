/* eslint-env node, mocha */
/* eslint no-undef: 1 */
/* eslint-disable import/no-extraneous-dependencies */

import sinon from 'sinon'; // eslint-disable-line
import { expect } from 'chai';
import ServiceModel from '../src/lib/service-model';

const credentialsObject = {
  dbName: 'testDb',
  dbUser: 'testName',
  dbPass: 'testPass',
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
      expect(() => new ServiceModel(credentials)).to.throw('Internal Server Error');
    });

    it('Should not create a db instance when missing DB user parameter', () => {
      const credentials = {
        dbName: 'testDb',
        dbPass: 'testPass',
        dbHost: 'localhost',
      };
      expect(() => new ServiceModel(credentials)).to.throw('Internal Server Error');
    });

    it('Should not create a db instance when missing DB password parameter', () => {
      const credentials = {
        dbName: 'testDb',
        dbUser: 'testName',
        dbHost: 'localhost',
      };
      expect(() => new ServiceModel(credentials)).to.throw('Internal Server Error');
    });

    it('Should not create a db instance when missing DB host parameter', () => {
      const credentials = {
        dbName: 'testDb',
        dbUser: 'testName',
        dbPass: 'testPass',
      };
      expect(() => new ServiceModel(credentials)).to.throw('Internal Server Error');
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
          expect(error.statusCode).to.be.eql(500);
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

  describe('Generate link options', () => {
    it('should return an object with previous and next properties', () => {
      const links = ServiceModel.generateLinkOptions(53, 2, 10, 'https://services.packpub.com/offers?page=');
      expect(links).to.have.all.keys('prev', 'next');
    });

    it('should return an object with undefined properties if there are no results', () => {
      const links = ServiceModel.generateLinkOptions(0, 1, 10, 'https://services.packpub.com/offers?page=');
      expect(links.prev).to.be.undefined;
      expect(links.next).to.be.undefined;
    });
  });
});

