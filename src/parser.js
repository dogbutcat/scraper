const Wire = require('./wire');
const config = require('./../config');
const net = require('net');

const torrentQueue = [];

const fillNum = (num) => `00${num}`.slice(-2);

/* eslint-disable no-extend-native */
Date.prototype.toMysqlFormat = function toMysqlFormat() {
	return `${this.getUTCFullYear()}-${fillNum(1 + this.getUTCMonth())}-${fillNum(this.getUTCDate())} ${fillNum(
		this.getUTCHours(),
	)}:${fillNum(this.getUTCMinutes())}:${fillNum(this.getUTCSeconds())}.${this.getMilliseconds()}`;
};
/* eslint-enable no-extend-native */

const clean = (data, bufferEncoding = 'utf8') => {
	if (Buffer.isBuffer(data)) {
		return data.toString(bufferEncoding);
	} else if (Array.isArray(data)) {
		return data.map((val) => clean(val));
	} else if (typeof data === 'object') {
		return Object.keys(data).reduce((result, key) => {
			let val;

			if (key === 'ed2k' || key === 'filehash') {
				val = clean(data[key], 'hex');
			} else {
				val = clean(data[key]);
			}
			return Object.assign(result, { [key]: val });
		}, {});
	}

	return data;
};

const filterTorrent = (names) =>
	names.filter((name) => config.filters.findIndex((element) => name.toLowerCase().includes(element)) > -1);
const getType = (names) => {
	const weights = names.reduce(
		(result, name) =>
			Object.keys(config.formats)
				.filter((key) => {
					const ext = name ? name.split('.').pop() : '';

					return config.formats[key].find((format) => format === ext);
				})
				.reduce(
					(weight, type) => Object.assign(weight, { [type]: weight[type] ? weight[type] + 1 : 1 }),
					result,
				),
		{},
	);

	return Object.keys(weights).reduce(
		(result, type) => (result && weights[result] > weights[type] ? result : type),
		'',
	);
};
const getTags = (names, type) =>
	names.reduce((result, name) => {
		const tags = config.tags
			.filter((tag) => {
				if (tag.type !== type) {
					return false;
				} else if (tag.includes && name.indexOf(tag.includes) > -1) {
					return true;
				} else if (tag.match && name.match(tag.match)) {
					return true;
				}
				return false;
			})
			.map(({ tag }) => tag);

		return result.concat(tags);
	}, []);

const upsertTorrent = async (torrent, knex) => {
	try {
		const { infohash, name, files, tags, type, length } = torrent,
			time = new Date();

		await knex.raw(
			`
			INSERT INTO torrents (infohash, name, files, tags, type, length, created, updated) 
				value (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE updated=?`,
			[infohash, name, files, tags, type, length, time, time, time],
		);
		if (config.debug) {
			console.log(`${torrent.infohash} - Upsetted`);
		}
	} catch (error) {
		if (config.debug) {
			console.log(error);
		}
	}
};

const bulkUpsertTorrents = async (knex) => {
	try {
		const spliceTorrents = torrentQueue.splice(0);
		const len = spliceTorrents.length;
		const itemsString = spliceTorrents.map(({ infohash, name, files, tags, type, length }) => {
			const time = new Date().toMysqlFormat();

			return `(${[
				`'${infohash}'`,
				`'${name.replace(/'/gu, "\\'")}'`,
				`'${files.replace(/'/gu, "\\'")}'`,
				`'${tags}'`,
				`'${type}'`,
				length,
				`'${time}'`,
				`'${time}'`,
			].join(',')})`;
		});

		const time = new Date();

		await knex.raw(
			`
			INSERT INTO torrents (infohash, name, files, tags, type, length, created, updated) 
				VALUES ${itemsString.join(',')} ON DUPLICATE KEY UPDATE updated=VALUES(updated)`,
		);
		console.log(`Bulk Insert Count: ${len}, Cost: ${(new Date() - time) / 1000} seconds`);
		if (config.debug) {
			console.log(`${len} Torrents Upsetted`);
		}
	} catch (error) {
		console.log(error);
	}
};

const queueTorrents = (torrent) => {
	torrentQueue.push(torrent);
};

const buildRecord = (names, knex, { files, infohash, name }) => {
	try {
		const type = getType(names);
		const tags = [...new Set(getTags(names, type))];

		const record = {
			files: JSON.stringify(files),
			infohash: infohash.toString('hex'),
			length: files.reduce((result, { length: fileLength }) => result + fileLength, 0),
			name,
			tags: tags.join(','),
			type,
		};

		if (config.crawler.enableBulk) {
			queueTorrents(record);
		} else {
			upsertTorrent(record, knex);
		}
	} catch (error) {
		console.log(error);
	}
};

const onMetadata = (metadata, infohash, knex) => {
	try {
		const { info = {} } = clean(metadata);
		const { files = [], length, name } = info;
		const names = files.map(({ path }) => (Array.isArray(path) ? path.join('/') : path)).concat(name);
		const invalid = filterTorrent(names);
		const filesWithOriginal = name && length ? [{ length, path: name }, ...files] : files;

		if (!invalid.length > 0 && files.length > 0) {
			buildRecord(names, knex, { files: filesWithOriginal, infohash, name });
		}
	} catch (error) {
		console.log(error);
	}
};

const getMetadata = (infohash, rinfo, knex) => {
	const socket = new net.Socket();

	socket.setTimeout(config.timeout || 5000);
	socket.connect(rinfo.port, rinfo.address, () => {
		const wire = new Wire(infohash);

		socket.pipe(wire).pipe(socket);

		wire.on('metadata', (metadata, hash) => {
			onMetadata(metadata, hash, knex);
			socket.destroy();
		});

		wire.on('fail', () => {
			socket.destroy();
		});

		wire.sendHandshake();
	});

	socket.on('error', () => {
		socket.destroy();
	});

	socket.on('timeout', () => {
		socket.destroy();
	});
};

const bulkInsertTorrentQueue = async (knex) => {
	if (torrentQueue.length > 0) {
		await bulkUpsertTorrents(knex);
	}
	setTimeout(() => {
		bulkInsertTorrentQueue(knex);
	}, (config.crawler.bulkFreq || 30) * 1000);
};

module.exports = { bulkInsertTorrentQueue, getMetadata };
