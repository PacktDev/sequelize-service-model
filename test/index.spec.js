/* eslint-env node, mocha */
/* eslint no-undef: 1 */
/* eslint-disable import/no-extraneous-dependencies */

import Sequelize from 'sequelize';
import { expect } from 'chai';
import uuid from 'uuid/v4';
import sinon from 'sinon';
import AuditClient from '@packt/audit-sdk';
import ServiceModel from '../src/index';