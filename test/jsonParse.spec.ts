/* eslint-env node, mocha */
/* eslint no-undef: 1 */
/* eslint-disable import/no-extraneous-dependencies */

import { expect } from 'chai';
import jsonParse from '../src/jsonParse';

describe('jsonParse', () => {
  it('Should return the parsed JSON if input is a string', done => {
    const validJsonString = '{"message": "test"}';
    jsonParse(validJsonString)
      .then(body => {
        expect(body).to.be.instanceof(Object);
        expect(body.message).to.equal('test');
        done();
      });
  });

  it('Should return an error with default statusCode and errorCode', done => {
    const invalidJson = '{"message": "test"';
    jsonParse(invalidJson)
      .catch(err => {
        expect(err.message).to.equal('Invalid json input');
        expect(err.statusCode).to.equal(400);
        expect(err.errorCode).to.equal(1000300);
        done();
      });
  });

  it('Should return an error with custom statusCode and errorCode', done => {
    const invalidJson = '{"message": "test"';
    jsonParse(invalidJson, 500, 1000)
      .catch(err => {
        expect(err.message).to.equal('Invalid json input');
        expect(err.statusCode).to.equal(500);
        expect(err.errorCode).to.equal(1000);
        done();
      });
  });
});
