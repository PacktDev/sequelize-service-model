/* eslint-env node, mocha */
/* eslint no-undef: 1 */
/* eslint-disable import/no-extraneous-dependencies */

import Sequelize from 'sequelize';
import { expect } from 'chai';
import uuid from 'uuid/v4';
import sinon from 'sinon';
import AuditClient from '@packt/audit-sdk';
import ServiceModel from '../src/lib/service-model';

const credentialsObject = {
  dbName: 'testDb',
  dbUser: 'testName',
  dbPass: 'testPass',
  dbHost: 'localhost',
};

const credentialsLoggingObject = {
  dbName: 'testDb',
  dbUser: 'testName',
  dbPass: 'testPass',
  dbHost: 'localhost',
  auditEs: 'http://localhost:9200',
  userId: uuid(),
};

const invalidCredentialsObject = {
  dbName: 'testDb',
  dbUser: 'wrongUser',
  dbPass: 'wrongPassword',
  dbHost: 'localhost',
};

const sequelizeModel = {
  id: {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
  },
  sqlCheck: Sequelize.STRING,
  createdAt: {
    allowNull: false,
    field: 'created_at',
    type: Sequelize.DATE,
  },
  updatedAt: {
    allowNull: false,
    field: 'updated_at',
    type: Sequelize.DATE,
  },
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

    it('Should return correct links when baseLink contains other query params', () => {
      const paginationObject = {
        count: 30,
        offset: 10,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers?sort=ASC',
      };

      const links = ServiceModel.generatePaginationLinks(paginationObject);
      expect(links.prev).to.equal('https://services.packpub.com/offers?sort=ASC&offset=0&limit=10');
      expect(links.next).to.equal('https://services.packpub.com/offers?sort=ASC&offset=20&limit=10');
    });

    it('Should return correct links when baseLink already contains offset and limit', () => {
      const paginationObject = {
        count: 30,
        offset: 10,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers?offset=55&limit=20',
      };

      const links = ServiceModel.generatePaginationLinks(paginationObject);
      expect(links.prev).to.equal('https://services.packpub.com/offers?offset=0&limit=10');
      expect(links.next).to.equal('https://services.packpub.com/offers?offset=20&limit=10');
    });

    it('Should return correct links when no query params present', () => {
      const paginationObject = {
        count: 30,
        offset: 10,
        limit: 10,
        baseLink: 'https://services.packpub.com/offers',
      };

      const links = ServiceModel.generatePaginationLinks(paginationObject);
      expect(links.prev).to.equal('https://services.packpub.com/offers?offset=0&limit=10');
      expect(links.next).to.equal('https://services.packpub.com/offers?offset=20&limit=10');
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
    it('Should return the parsed JSON if input is a string', (done) => {
      const validJsonString = '{"message": "test"}';
      ServiceModel.jsonParse(validJsonString)
        .then((body) => {
          expect(body).to.be.instanceof(Object);
          expect(body.message).to.equal('test');
          done();
        });
    });

    it('Should return the provided input if it is not a string', (done) => {
      const testObject = { message: 'test' };
      ServiceModel.jsonParse(testObject)
        .then((body) => {
          expect(body).to.be.instanceof(Object);
          expect(body.message).to.equal('test');
          done();
        });
    });

    it('Should return an error with default statusCode and errorCode', (done) => {
      const invalidJson = '{"message": "test"';
      ServiceModel.jsonParse(invalidJson)
        .catch((err) => {
          expect(err.message).to.equal('Invalid json input');
          expect(err.statusCode).to.equal(400);
          expect(err.errorCode).to.equal(1000300);
          done();
        });
    });

    it('Should return an error with custom statusCode and errorCode', (done) => {
      const invalidJson = '{"message": "test"';
      ServiceModel.jsonParse(invalidJson, 500, 1000)
        .catch((err) => {
          expect(err.message).to.equal('Invalid json input');
          expect(err.statusCode).to.equal(500);
          expect(err.errorCode).to.equal(1000);
          done();
        });
    });
  });
  describe('Auditting', () => {
    before((done) => {
      const sequelize = new Sequelize(credentialsObject.dbName, credentialsObject.dbUser, credentialsObject.dbPass, {
        host: credentialsObject.dbHost,
        dialect: 'postgres',
      });
      sequelize.queryInterface.createTable(
        'tests',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4,
          },
          sqlCheck: Sequelize.STRING,
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
          },
        },
      ).then(() => {
        sequelize.close();
        done();
      });
    });
    it('Creates a db instance and valid logging with a valid config', () => {
      const serviceModel = new ServiceModel(credentialsLoggingObject);

      expect(serviceModel.db).to.be.instanceof(Object);
      expect(serviceModel.db.options.dialect).to.be.eql('postgres');

      expect(serviceModel.audit).to.be.instanceof(Object);

      serviceModel.closeDb();
    });
    it('Get valid audit object', () => {
      const serviceModel = new ServiceModel(credentialsLoggingObject);
      const audit = serviceModel.getAudit();

      expect(audit).to.be.instanceof(AuditClient);

      serviceModel.closeDb();
    });
    it('afterCreate', async () => {
      const serviceModel = new ServiceModel(credentialsLoggingObject);
      const db = serviceModel.getDb();
      const spy = sinon.stub(serviceModel.audit.elastic, 'sendLog');
      spy.returns(Promise.resolve(true));
      const Tests = db.define('tests', sequelizeModel);
      await Tests.create({
        sqlCheck: 'CREATE',
      });

      serviceModel.closeDb();
      expect(spy.called).to.equal(true);
      expect(spy.firstCall.args[0].userId).to.equal(credentialsLoggingObject.userId);
      expect(spy.firstCall.args[0].queryType).to.equal('CREATE');
    });
    it('afterDestroy', async () => {
      const serviceModel = new ServiceModel(credentialsLoggingObject);
      const db = serviceModel.getDb();
      const spy = sinon.stub(serviceModel.audit.elastic, 'sendLog');
      spy.returns(Promise.resolve(true));
      const Tests = db.define('tests', sequelizeModel);
      await Tests.create({
        sqlCheck: 'CREATE',
      })
        .then(data => Tests.destroy({
          where: { id: data.dataValues.id },
        }));

      serviceModel.closeDb();

      expect(spy.called).to.equal(true);
      expect(spy.args[1][0].userId).to.equal(credentialsLoggingObject.userId);
      expect(spy.args[1][0].queryType).to.equal('DELETE');
    });
    it('afterUpdate', async () => {
      const serviceModel = new ServiceModel(credentialsLoggingObject);
      const db = serviceModel.getDb();
      const spy = sinon.stub(serviceModel.audit.elastic, 'sendLog');
      spy.returns(Promise.resolve(true));
      const Tests = db.define('tests', sequelizeModel);
      await Tests.create({
        sqlCheck: 'CREATE',
      })
        .then(data => Tests.update({
          sqlCheck: 'UPDATE',
        }, {
          where: { id: data.id },
        }));

      serviceModel.closeDb();

      expect(spy.called).to.equal(true);
      expect(spy.args[1][0].userId).to.equal(credentialsLoggingObject.userId);
      expect(spy.args[1][0].queryType).to.equal('UPDATE');
    });
    it('afterSave - not called', async () => {
      const serviceModel = new ServiceModel(credentialsLoggingObject);
      const db = serviceModel.getDb();
      const spy = sinon.stub(serviceModel.audit.elastic, 'sendLog');
      spy.returns(Promise.resolve(true));
      const Tests = db.define('tests', sequelizeModel);
      const testCase = Tests.build({
        sqlCheck: 'CREATE',
      });
      await testCase.save();

      serviceModel.closeDb();
      expect(spy.called).to.equal(true);
      expect(spy.firstCall.args[0].userId).to.equal(credentialsLoggingObject.userId);
      expect(spy.firstCall.args[0].queryType).to.equal('CREATE');
      expect(spy.args.length).to.equal(1);
    });
    it('afterUpsert', async () => {
      const serviceModel = new ServiceModel(credentialsLoggingObject);
      const db = serviceModel.getDb();
      const spy = sinon.stub(serviceModel.audit.elastic, 'sendLog');
      spy.returns(Promise.resolve(true));
      const Tests = db.define('tests', sequelizeModel);
      await Tests.upsert({
        sqlCheck: 'CREATE',
      });

      serviceModel.closeDb();
      expect(spy.called).to.equal(true);
      expect(spy.firstCall.args[0].userId).to.equal(credentialsLoggingObject.userId);
      expect(spy.firstCall.args[0].queryType).to.equal('UPSERT');
    });
  });
});

