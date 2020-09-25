const filters = require('./filters');
const formats = require('./formats');
const tags = require('./tags');

const config = {
	bootstrapNodes: [
		{ address: 'router.bittorrent.com', port: 6881 },
		{ address: 'dht.transmissionbt.com', port: 6881 },
	],
	crawler: {
		address: '0.0.0.0',
		bulkCount: 200,
		bulkFreq: 20,
		enableBulk: true,
		frequency: 4,
		parseHexKeys: ['ed2k', 'filehash', 'sha1'],
		port: 6881,
	},
	db: {
		/*
		 * SQLITE DB
		 * 	client: 'sqlite3',
		 * 	connection: {
		 * 		filename: './db.sqlite3',
		 * 	},
		 * 	useNullAsDefault: true,
		 */
		client: 'mysql',
		connection: {
			charset: 'utf8mb4',
			database: 'alphareign',
			host: '127.0.0.1',
			password: '123456',
			user: 'root',
			// insert emoji into db
		},
	},
	debug: false,
	elasticsearch: {
		host: '127.0.0.1',
		// auth: 'elastic:elastic',
		port: 9200,
	},
	filters,
	formats,
	search: {
		// Seconds between every bulk insert
		frequency: 60,
		// Amount of torrents to update in elasticsearch at once
		limit: 1000,
	},
	summary: true,
	tags,
	tracker: {
		// Minutes before we should try and update a torrent again
		age: 360,
		// Seconds between every scrape
		frequency: 1,
		host: 'udp://tracker.coppersurfer.tk:6969/announce',
		limit: 75,
		remoteHosts: [
			//	contain ipv6 tracker
			//	'https://trackerslist.com/all.txt',
			'https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_all.txt',
		],
		// Remote track age in days
		remoteTrackAge: 2,
		retryTimes: 2,
	},
};

module.exports = config;
