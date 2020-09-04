#! /usr/local/bin/node
const config = require('./config');
const knex = require('knex')(config.db);

require('./src/loader.js')(knex);
require('./src/scraper.js')(knex);
require('./src/tracker.js')(knex);
