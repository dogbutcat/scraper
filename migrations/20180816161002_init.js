exports.up = async (knex) => {
	await knex.schema.createTable('torrents', (table) => {
		table.charset('utf8mb4');
		// only applicable to MYSQL
		table.collate('utf8mb4_unicode_ci');
		table.string('infohash', 40).primary();
		table.string('name');
		table.text('files', 'longtext');
		table.string('tags');
		table.string('type');
		table.bigInteger('length');
		table.dateTime('created');
		table.dateTime('updated');
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists('torrents');
};
