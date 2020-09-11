const config = require('./../config');
const crawler = require('./crawler');
const parser = require('./parser');
// const tracker = require('./tracker');
let knex;

const fillNum = (num) => `00${num}`.slice(-2);

const getCount = async () => {
	const [{ allCounts: count, noTrackerCounts: count2, noLoadCounts: count3 }] = await knex('torrents').select(
		knex.raw(
			'SUM(1) AS allCounts, SUM(IF(trackerUpdated IS NULL, 1, 0)) AS noTrackerCounts, SUM(IF(searchUpdated IS NULL,1,0)) AS noLoadCounts',
		),
	);
	const time = new Date();

	console.log(
		`${time.getFullYear()}-${fillNum(time.getMonth())}-${fillNum(time.getDate())} ${fillNum(
			time.getHours(),
		)}:${fillNum(time.getMinutes())}:${fillNum(time.getSeconds())}`,
	);
	console.log(`Total Torrents: ${count}`);
	console.log(`Torrents without Tracker: ${count2}`);
	console.log(`Torrents not in Search: ${count3}`);
	setTimeout(() => getCount(), 60 * 1000);
};

const addTorrent = async (infohash, rinfo) => {
	try {
// 		const records = await knex('torrents').where({ infohash: infohash.toString('hex') });

// 		if (records.length === 0 || !records[0].name) {
			parser(infohash, rinfo, knex);
// 		}
	} catch (error) {
		if (config.debug) {
			console.log(error);
		}
	}
};

const scrape = (db) => {
	knex = db;
	crawler(addTorrent);
	// tracker(knex);
	if (config.summary) {
		getCount();
	}
};

module.exports = scrape;
