const tableName = 'cards';

exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments('id');
    table.enu('category', [1, 2, 3, 4], {
      useNative: true,
      enumName: 'category',
    });
    table.string('headline', 255);
    table.string('text', 1000).notNullable();
    table.integer('board_id').unsigned().notNullable();
    table
      .foreign('board_id')
      .references('id')
      .inTable('boards')
      .onDelete('CASCADE');
    table.integer('created_by').unsigned().notNullable();
    table
      .foreign('created_by')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamps(false, true);
  });

  await knex.raw(`
    CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON ${tableName}
    FOR EACH ROW
    EXECUTE PROCEDURE update_timestamp();
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTable(tableName);
  await knex.raw(`DROP TYPE category`);
};
