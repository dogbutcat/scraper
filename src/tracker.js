const Client = require('bittorrent-tracker');
const config = require('./../config');
const https = require('https');

// [0] is date, [1] is announce data
let remoteTrackData = [null, null];

function batchUpdateRecords(knex, records) {
	const hashes = Object.keys(records);
	const hashLen = hashes.length,
		infoHashes = [];
	let leecherWhen = '',
		seederWhen = '';

	for (let i = 0; i < hashLen; i += 1) {
		const record = records[hashes[i]];

		leecherWhen += `WHEN '${record.infoHash}' THEN ${record.incomplete} `;
		seederWhen += `WHEN '${record.infoHash}' THEN ${record.complete} `;
		infoHashes.push(`${record.infoHash}`);
	}
	return knex.raw(
		`
		UPDATE torrents
			SET leechers = CASE infohash 
				${leecherWhen}
			END, 
			seeders = CASE infohash 
				${seederWhen}
			END,
			searchUpdate = ?,
			trackerUpdated = ?
		WHERE infoHash in (?)
	`,
		[false, new Date(), infoHashes],
	);
}

const updateRecord = async (knex, record) => {
	if (config.debug) {
		console.log(`${record.infoHash} - ${record.complete}:${record.incomplete}`);
	}
	await knex('torrents')
		.update({
			leechers: record.incomplete,
			searchUpdate: false,
			seeders: record.complete,
			trackerUpdated: new Date(),
		})
		.where({ infohash: record.infoHash });
};

const getTracker = (url) =>
	new Promise((resolve, reject) => {
		https.get(url, (res) => {
			res.setEncoding('utf8');
			let body = '';

			res.on('data', (data) => {
				body += data;
			});
			res.on('error', (err) => {
				reject(err);
			});
			res.on('end', () => {
				resolve(body);
			});
		});
	});

const getRemoteTracker = async (date) => {
	let announce = [config.tracker.host];
	const remoteHosts = config.tracker.remoteHosts || [];

	const reqs = remoteHosts.map((trackerUrl) => getTracker(trackerUrl));

	try {
		const datas = await Promise.all(reqs);

		datas.forEach((str) => {
			announce = announce.concat(str.split('\n').filter((val) => Boolean(val)));
		});
	} catch (error) {
		if (config.debug) {
			console.log('[ERR]Get Tracker List: ', error);
		}
	}

	remoteTrackData = [date, announce];
	return announce;
};

const getCacheTracker = () => {
	const date = Number(new Date()),
		[_d, _t] = remoteTrackData;

	if (_d && date - Number(_d) < config.tracker.remoteTrackAge * 24 * 60 * 60 * 1000) {
		return _t;
	}

	return getRemoteTracker(date);
};

const scrape = async (knex, records) => {
	const announce = await getCacheTracker();

	const options = {
		announce,
		infoHash: records.map(({ infohash }) => infohash),
	};

	try {
		const results = await new Promise((resolve, reject) => {
			Client.scrape(options, (error, data) => (error ? reject(error) : resolve(data)));
		});

		console.log('Scrape Success: ', results.infoHash || Object.keys(results).length);
		if (results.infoHash) {
			await updateRecord(knex, results);
		} else {
			await batchUpdateRecords(knex, results);
		}
	} catch (error) {
		// Do nothing
		console.log('Scrape Error: ', error);
	}
};

const getRecords = async (knex) => {
	const newRecords = await knex('torrents')
		.select('infohash')
		.whereNull('trackerUpdated')
		.limit(config.tracker.limit);
	const newLimit = config.tracker.limit - newRecords.length;
	const age = new Date(Date.now() - 1000 * 60 * config.tracker.age);
	const outdatedRecords = await knex('torrents')
		.select('infohash')
		.where('trackerUpdated', '<', age)
		.limit(newLimit);

	return [...newRecords, ...outdatedRecords];
};

const tracker = async (knex) => {
	const records = await getRecords(knex);

	if (records.length > 0) {
		try {
			await scrape(knex, records);
		} catch (error) {
			// Do nothing
		}
	}

	setTimeout(() => tracker(knex), config.tracker.frequency * 1000);
};

module.exports = tracker;
