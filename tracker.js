const config = require('./../config');
const tracker = require('./tracker');
const knex = require('knex')(config.db);

tracker(knex);
