import errorCustom from '@packt/error-custom';

/**
 * Parsing a JSON string
 *
 * @param {string} jsonString
 * The JSON string
 *
 * @param {number} [statusCode]
 * The status code to be passed to ErrorCustom
 *
 * @param {number} [errorCode]
 * The error code to be passed to ErrorCustom
 *
 * @return {Promise<object,errorCustom>}
 * Returns the parsed object or an ErrorCustom
 */
export default (jsonString, statusCode = 400, errorCode = 1000300): object & errorCustom => new Promise(
  (resolve, reject) => {
    try {
      const jsonObject = typeof jsonString === 'string'
        ? JSON.parse(jsonString)
        : jsonString;
      return resolve(jsonObject);
    } catch (e) {
      return reject(new errorCustom(
        'Invalid json input',
        statusCode,
        errorCode,
      ));
    }
  },
);
