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
   * Get Sequelize Constructor
   *
   * @return {Object}
   * Sequelize Constructor
   */
  static getSequelize() {
    return Sequelize;
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
   * @param {object} paginationOptions
   * Pagination options object
   *
   * @param {number} paginationOptions.count
   * The number of results produced from the query
   *
   * @param {number} paginationOptions.pageNumber
   * The page (offset) currently being accessed
   *
   * @param {number} paginationOptions.pageSize
   * The size of one page
   *
   * @param {string} paginationOptions.baseLink
   * A customised link can be provided for the pagination URL or use default
   * Ex: https://services.packpub.com/offers?page=
   *
   * @return {object}
   * Containing the next and previous links
   */
  static generateLinkOptions(paginationOptions) {
    const paginationOptionsJoiSchema = {
      count: Joi.number().options({ convert: false }).integer().min(0)
        .required(),
      pageNumber: Joi.number().options({ convert: false }).min(1),
      pageSize: Joi.number().options({ convert: false }).min(1).required(),
      baseLink: Joi.string().uri({
        scheme: 'https',
      }).required(),
    };

    const validatedPaginationOptions = Joi.validate(paginationOptions, paginationOptionsJoiSchema);

    if (!paginationOptions || validatedPaginationOptions.error) {
      throw new Error('Please provide valid pagination options.');
    }

    const {
      count,
      pageSize,
      baseLink,
    } = paginationOptions;

    const pageNumber = paginationOptions.pageNumber || 1;
    const hasResults = count > 0;
    const totalPages = Math.ceil(count / pageSize);
    const notFirstPage = hasResults && pageNumber > 1;
    const hasMorePages = pageNumber < totalPages;

    const links = {};

    if (notFirstPage) {
      links.prev = `${baseLink}${pageNumber - 1}`;
    }

    if (hasMorePages) {
      links.next = `${baseLink}${pageNumber + 1}`;
    }

    return links;
  }
}
