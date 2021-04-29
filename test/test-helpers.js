const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function makeUsersArray() {
  return [
    {
      id: 1,
      email: 'jim.halpert@dundermifflin.com',
      password: 'password',
      first_name: 'Jim',
      last_name: 'Halpert',
    },
    {
      id: 2,
      email: 'worldsbestboss@dundermifflin.com',
      password: 'password',
      first_name: 'Michael',
      last_name: 'Scott',
    },
    {
      id: 3,
      email: 'pam.beasley@dundermifflin.com',
      password: 'password',
      first_name: 'Pam',
      last_name: 'Beasley',
    },
  ];
}

function makeRacksFixtures() {
  const testUsers = makeUsersArray();

  return { testUsers };
}

function seedUsers(db, users) {
  const preppedUsers = users.map((user) => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1),
  }));

  return db
    .into('users')
    .insert(preppedUsers)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(`SELECT setval('users_id_seq', ?)`, [users[users.length - 1].id])
    );
}

function cleanTable(db) {
  return db.transaction((trx) =>
    trx
      .raw(
        `TRUNCATE
        cards,
        boards,
        team_members,
        teams,
        users
    `
      )
      .then(() =>
        Promise.all([
          trx.raw(`ALTER SEQUENCE cards_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE boards_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE teams_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE users_id_seq minvalue 0 START WITH 1`),
          trx.raw(`SELECT setval('cards_id_seq', 0)`),
          trx.raw(`SELECT setval('boards_id_seq', 0)`),
          trx.raw(`SELECT setval('teams_id_seq', 0)`),
          trx.raw(`SELECT setval('users_id_seq', 0)`),
        ])
      )
  );
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ id: user.id }, secret, {
    subject: user.email,
    algorithm: 'HS256',
  });
  return `Bearer ${token}`;
}

module.exports = {
  makeUsersArray,
  makeRacksFixtures,
  seedUsers,
  cleanTable,
  makeAuthHeader,
};
