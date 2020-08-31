const config = require('./../config');

function batchUpdateRecords(knex, records) {
	const infoHashes = [];
	let leecherWhen = '',
		seederWhen = '';

	for (let i = 0; i < records.length; i += 1) {
		const record = records[i];

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
		[true, new Date(), infoHashes],
	);
}

batchUpdateRecords(require('knex')(config.db), [
	{
		complete: 0,
		created: '2020-08-27 12:18:46',
		files:
			'[{"length":330171209,"path":["Bahamas.Life.S03E04.Generational.Dreams.720p.HEVC.x265-MeGusta.mkv"]},{"length":1229,"path":["Bahamas.Life.S03E04.Generational.Dreams.720p.HEVC.x265-MeGusta.nfo"]},{"length":1653182,"path":["Screens","screen0001.png"]},{"length":1663096,"path":["Screens","screen0002.png"]},{"length":1533289,"path":["Screens","screen0003.png"]},{"length":1148253,"path":["Screens","screen0004.png"]},{"length":86,"path":["Torrent Downloaded From www.torrenting.com.txt"]}]',
		incomplete: 1,
		infoHash: '0001b1e6fe92d55facb29ed2f2951b7dc5a648e2',
		length: 336170344,
		name: 'www.torrenting.com - Bahamas.Life.S03E04.Generational.Dreams.720p.HEVC.x265-MeGusta',
		searchUpdate: 1,
		searchUpdated: '2020-08-28 00:19:49',
		tags: '720,show',
		trackerUpdated: '2020-08-28 00:19:12',
		type: 'video',
		updated: '2020-08-27 12:18:46',
	},
	{
		complete: 0,
		created: '2020-08-27 12:03:25',
		files:
			'[{"length":360859450,"path":["Harlots.S03E07.WEB.x264-PHOENiX.mkv"]},{"length":689,"path":["[TGx]Downloaded from torrentgalaxy.to .txt"]}]',
		incomplete: 4,
		infoHash: '0001b2363a1b11bfb30dc4b5ca3ea06142f8bf5e',
		length: 360860139,
		name: 'Harlots.S03E07.WEB.x264-PHOENiX[TGx]',
		searchUpdate: 1,
		searchUpdated: '2020-08-28 00:05:35',
		tags: 'show',
		trackerUpdated: '2020-08-28 00:04:15',
		type: 'video',
		updated: '2020-08-27 12:03:25',
	},
	{
		complete: 1,
		created: '2020-08-27 12:39:29',
		files:
			'[{"length":1592395,"path":["Strangers by C.L. Taylor.epub"]},{"length":1015,"path":["free audiobook version.txt"]}]',
		incomplete: 0,
		infoHash: '0002f6e5ede708a2c5f5ebb80b0b606f092cc64f',
		length: 1593410,
		name: 'Strangers by C.L. Taylor EPUB',
		searchUpdate: 1,
		searchUpdated: '2020-08-28 00:40:33',
		tags: '',
		trackerUpdated: '2020-08-28 00:39:49',
		type: 'document',
		updated: '2020-08-27 12:39:29',
	},
	{
		complete: 0,
		created: '2020-08-27 12:03:49',
		files:
			'[{"length":6709450,"path":["01 - Coming Back for You.mp3"]},{"length":8583983,"path":["02 - Ciel du nord.mp3"]},{"length":6895426,"path":["03 - Lakeshore 1.mp3"]},{"length":8511881,"path":["04 - Relaxation.mp3"]},{"length":20518800,"path":["05 - Dreaming.mp3"]},{"length":10774079,"path":["06 - Breathe.mp3"]},{"length":8895349,"path":["07 - Hills.mp3"]},{"length":13459475,"path":["08 - Fresh Air 1.mp3"]},{"length":8010326,"path":["09 - Lydian 2.mp3"]},{"length":15138622,"path":["10 - Nature 1.mp3"]},{"length":14487651,"path":["11 - Hypnosis.mp3"]},{"length":21233516,"path":["12 - Deep Water.mp3"]},{"length":7659243,"path":["13 - Nature 3.mp3"]},{"length":8791906,"path":["14 - Stars.mp3"]},{"length":2667775,"path":["15 - Improvisation.mp3"]},{"length":15461512,"path":["16 - Spa (Orchestral).mp3"]},{"length":12269360,"path":["17 - The Light (Orchestral).mp3"]},{"length":13388424,"path":["18 - Fresh Air 2.mp3"]},{"length":7461763,"path":["19 - Lakeshore 2.mp3"]},{"length":102119,"path":["folder.jpg"]}]',
		incomplete: 0,
		infoHash: '0003711dcf6c178f229e1a39ece0619582380041',
		length: 211020660,
		name: 'Jamie Dupuis - Harp Guitar Relaxation (2018)',
		searchUpdate: 1,
		searchUpdated: '2020-08-28 00:05:35',
		tags: '',
		trackerUpdated: '2020-08-28 00:04:40',
		type: 'audio',
		updated: '2020-08-27 12:03:49',
	},
]).then((resp) => console.log(resp));
