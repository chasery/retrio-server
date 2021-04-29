const tableName = 'boards';

exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments('id');
    table.string('name', 255).notNullable();
    table.integer('owner_id').unsigned().notNullable();
    table
      .foreign('owner_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.integer('team_id').unsigned().notNullable();
    table
      .foreign('team_id')
      .references('id')
      .inTable('teams')
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

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};
