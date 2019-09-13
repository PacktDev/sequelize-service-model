import joi from '@hapi/joi';
import sequelize from 'sequelize';
import { URL } from 'url';

import IDbConfig from './interfaces/db-config-interface';
import PaginationLinks from './pagination-links';
import IPaginationOptions from './interfaces/pagination-options-interface';

/**
 * ServiceModel a helper for sequelize
 */
export default class ServiceModel {
  /**
   * Gets the sequelize constructor
   * @return {Sequelize}
   */
  public static getSequelize(): {} {
    return sequelize;
  }

  /**
   * Validates the DB config
   *
   * @param {IDbConfig} config
   * The config for creating a new DB instance
   *
   * @return {boolean}
   * True/false based on config validity
   */
  public static isValidDbConfig(config: IDbConfig): boolean {
    const joiConfigSchema = {
      dbHost: joi.string().required(),
      dbName: joi.string().required(),
      dbPass: joi.string().required(),
      dbUser: joi.string().required(),
      debug: joi.boolean(),
      userId: joi.string().guid(),
    };

    const joiValidationResult = joi.validate(config, joiConfigSchema);
    return !joiValidationResult.error;
  }

  /**
   * Function to create the DB connection
   *
   * @param  {IDbConfig} config
   * variables including db params
   *
   * @return {sequelize.Sequelize}
   * sequelize db object
   */
  public static createDb(config: IDbConfig): sequelize.Sequelize {
    return new sequelize.Sequelize(config.dbName, config.dbUser, config.dbPass, {
      dialect: 'postgres',
      host: config.dbHost,
      logging: config.debug || false,
    });
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
   * @param {number} paginationOptions.offset
   * The results offset currently being accessed
   *
   * @param {number} paginationOptions.limit
   * The size of one page
   *
   * @param {string} paginationOptions.baseLink
   * Link to the endpoint that needs pagination
   * Ex: https://services.packpub.com/offers
   *
   * @return {PaginationLinks}
   * Containing the next and previous links
   */
  public static generatePaginationLinks(paginationOptions: IPaginationOptions): PaginationLinks {
    const paginationOptionsJoiSchema = {
      baseLink: joi
        .string()
        .uri({
          scheme: 'https',
        })
        .required(),
      count: joi
        .number()
        .options({ convert: false })
        .integer()
        .min(0)
        .required(),
      limit: joi
        .number()
        .options({ convert: false })
        .min(1)
        .required(),
      offset: joi
        .number()
        .options({ convert: false })
        .min(0),
    };

    const validatedPaginationOptions = joi.validate(paginationOptions, paginationOptionsJoiSchema);

    if (!paginationOptions || validatedPaginationOptions.error) {
      throw new Error('Please provide valid pagination options.');
    }

    const { count, offset = 0, limit } = paginationOptions;

    const baseUrl = new URL(paginationOptions.baseLink);
    const hasResults = count > 0;
    const hasPrev = hasResults && offset >= 1;
    const hasNext = offset < count - limit;

    const links = new PaginationLinks();

    if (hasPrev) {
      const newOffset = offset < limit ? 0 : offset - limit;
      baseUrl.searchParams.set('offset', newOffset.toString());
      baseUrl.searchParams.set('limit', limit.toString());
      links.prev = baseUrl.toString();
    }

    if (hasNext) {
      const newOffset = offset + limit;
      baseUrl.searchParams.set('offset', newOffset.toString());
      baseUrl.searchParams.set('limit', limit.toString());
      links.next = baseUrl.toString();
    }

    return links;
  }

  public db: sequelize.Sequelize;

  /**
   * @constructor
   * Constructor for services class. Creates a sequelize object on initialisation
   * @param  {IDbConfig} config
   * The database config object
   */
  constructor(config: IDbConfig) {
    if (!ServiceModel.isValidDbConfig(config)) {
      throw new Error('Invalid DB credentials');
    }

    this.db = ServiceModel.createDb(config);
  }

  /**
   * Returns instance of the db object
   *
   * @return {object}
   * sequelize db instance
   */
  public getDb(): object {
    return this.db;
  }

  /**
   * Closes the db connection.
   */
  public closeDb() {
    this.db.close();
  }

  /**
   * Checks the db connection
   *
   * @return {promise}
   * sequelize promise object
   */
  public async checkDbConnectivity(): Promise<void | Error> {
    return this.db
      .authenticate()
      .catch(() => Promise.reject(new Error('Unable to connect to the database')));
  }
}
