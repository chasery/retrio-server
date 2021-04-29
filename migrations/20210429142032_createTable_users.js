const tableName = 'users';

exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments('id');
    table.string('email', 255).unique().notNullable();
    table.string('password', 255).notNullable();
    table.string('first_name', 255);
    table.string('last_name', 255);
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
