const tableName = 'retrio_teamMembers';

exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.integer('user_id').unsigned().notNullable();
    table
      .foreign('user_id')
      .references('id')
      .inTable('retrio_users')
      .onDelete('CASCADE');
    table.integer('team_id').unsigned().notNullable();
    table
      .foreign('team_id')
      .references('id')
      .inTable('retrio_teams')
      .onDelete('CASCADE');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(tableName);
};
