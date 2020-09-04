const config = require('./config');
const knex = require('knex')(config.db);

require('./src/tracker')(knex);
