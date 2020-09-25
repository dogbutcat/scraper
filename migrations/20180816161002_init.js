function addField(table) {
	table.bigInteger('timestamp');
	table.index(['timestamp'], 'timestamp_index');
}

function presetEnv(table) {
	table.charset('utf8mb4');
	// only applicable to MYSQL
	table.collate('utf8mb4_unicode_ci');
}

exports.up = async (knex) => {
	await knex.schema.createTable('torrents', (table) => {
		presetEnv(table);
		table.string('infohash', 40).primary();
		table.string('name');
		table.text('files', 'longtext');
		table.string('tags');
		table.string('type');
		table.bigInteger('length');
		table.dateTime('created');
		table.dateTime('updated');
		addField(table);
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists('torrents');
};
