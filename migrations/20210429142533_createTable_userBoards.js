const tableName = 'user_boards';

exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments('id');
    table.integer('board_id').unsigned().notNullable();
    table
      .foreign('board_id')
      .references('id')
      .inTable('boards')
      .onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable();
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.boolean('owner');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};
