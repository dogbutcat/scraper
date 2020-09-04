#! /usr/local/bin/node
const config = require('./config');
const knex = require('knex')(config.db);

require('./src/scraper.js')(knex);
