/* eslint-disable camelcase */
const config = require('./../config');
const elasticsearch = require('elasticsearch');

const client = new elasticsearch.Client({ host: [config.elasticsearch] });

const getRecords = (knex) =>
	knex('torrents')
		.where({ searchUpdate: false })
		.limit(config.search.limit);

const parseRecord = (record) => {
	const parsedRecord = {
		...record,
		files: [],
		search: record.name
			? record.name
					.replace(/_/gu, ' ')
					.replace(/ /gu, ' ')
					.replace(/\./gu, ' ')
					.replace(/-/gu, ' ')
			: '',
	};

	try {
		parsedRecord.files = record.files ? JSON.parse(record.files) : [];
		parsedRecord.files = parsedRecord.files.map((file) => ({
			length: file.length,
			path: file.path.join('/'),
		}));
	} catch (error) {
		// Do nothing - files is too long
	}

	return parsedRecord;
};

const update = async (knex, records) => {
	const parsedRecords = records.filter(({ name }) => Boolean(name)).map(parseRecord);
	const body = parsedRecords.reduce(
		(result, record) => [
			...result,
			{
				update: {
					_id: record.infohash,
					_index: 'torrents',
					// _retry_on_conflict: 3,
					_type: 'hash',
				},
			},
			{
				doc: record,
				doc_as_upsert: true,
			},
		],
		[],
	);

	const response = await client.bulk({ body });

	if (response.errors) {
		const errors = response.items.filter((item) => item.update.error);

		console.log('[ERROR] ELASTIC: ', errors);
	}

	await knex('torrents')
		.update({
			searchUpdate: true,
			searchUpdated: new Date(),
		})
		.whereIn(
			'infohash',
			records.map(({ infohash }) => infohash),
		);
};

const loader = async (knex) => {
	const records = await getRecords(knex);

	if (records.length > 0) {
		try {
			await update(knex, records);
		} catch (error) {
			console.log(error);
			// Do nothing
		}
	}

	setTimeout(() => loader(knex), config.search.frequency * 1000);
};

module.exports = loader;
