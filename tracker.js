const config = require('./config');
const tracker = require('./src/tracker');
const knex = require('knex')(config.db);

tracker(knex);
