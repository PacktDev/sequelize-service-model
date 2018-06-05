import Sequelize from 'sequelize';
import Joi from 'joi';
import ErrorCustom from '@packt/error-custom';

export default class ServiceModel {
  /**
   * Constructor for services class. Creates a sequelize object on initialisation
   * @param  {object} config
   * The database config object
   *
   * @return {object}
   * Instance of the service
   */
  constructor(config) {
    if (!ServiceModel.isValidDbConfig(config)) {
      throw new ErrorCustom('Internal Server Error', 500);
    }

    this.db = ServiceModel.createDb(config);
  }

  /**
   * Validates the DB config
   *
   * @param {object} config
   * The config for creating a new DB instance
   *
   * @return {boolean}
   * True/false based on config validity
   */
  static isValidDbConfig(config) {
    const joiConfigSchema = {
      dbName: Joi.string().required(),
      dbUser: Joi.string().required(),
      dbPass: Joi.string().required(),
      dbHost: Joi.string().required(),
    };

    const joiValidationResult = Joi.validate(config, joiConfigSchema);
    return !joiValidationResult.error;
  }

  /**
   * Function to create the DB connection
   *
   * @param  {object} config
   * variables including db params
   *
   * @return {object}
   * sequelize db object
   */
  static createDb(config) {
    return new Sequelize(config.dbName, config.dbUser, config.dbPass, {
      host: config.dbHost,
      dialect: 'postgres',
    });
  }

  /**
   * Returns instance of the db object
   *
   * @return {object}
   * sequelize db instance
   */
  getDb() {
    return this.db;
  }

  /**
   * Closes the db connection.
   */
  closeDb() {
    this.db.close();
  }

  /**
   * Checks the db connection
   *
   * @return {promise}
   * sequelize promise object
   */
  checkDbConnectivity() {
    return this.db
      .authenticate()
      .catch(() => Promise.reject(new ErrorCustom('Unable to connect to the database', 500)));
  }

  /**
   * Returns an object containing the appropriate pagination links
   * based on the number of results, pageNumber currently accessing and pageSize.
   *
   * @param {number} count
   * The number of results produced from the query
   *
   * @param {number} pageNumber
   * The page (offset) currently being accessed
   *
   * @param {number} pageSize
   * The size of one page
   *
   * @param {string} baseLink
   * A customised link can be provided for the pagination URL or use default
   * Ex: https://services.packpub.com/offers?page=
   *
   * @return {object}
   * Containing the next and previous links
   */
  static generateLinkOptions(count, pageNumber, pageSize, baseLink) {
    const hasResults = count > 0;
    const totalPages = Math.ceil(count / pageSize);
    const notFirstPage = hasResults && pageNumber > 1;
    const hasMorePages = pageNumber < totalPages;
    return {
      next: hasMorePages ? `${baseLink}${pageNumber + 1}` : undefined,
      prev: notFirstPage ? `${baseLink}${pageNumber - 1}` : undefined,
    };
  }
}
