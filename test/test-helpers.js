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

function makeTeamsArray() {
  return [
    {
      id: 1,
      name: 'Sales',
    },
    {
      id: 2,
      name: 'Leadership',
    },
    {
      id: 3,
      name: 'Accounting',
    },
  ];
}

function makeTeamMembersArray() {
  return [
    // 1
    {
      id: 1,
      user_id: 1,
      team_id: 1,
      owner: true,
    },
    {
      id: 2,
      user_id: 1,
      team_id: 2,
      owner: false,
    },
    // 2
    {
      id: 3,
      user_id: 2,
      team_id: 1,
      owner: false,
    },
    {
      id: 4,
      user_id: 2,
      team_id: 2,
      owner: true,
    },
    {
      id: 5,
      user_id: 2,
      team_id: 3,
      owner: false,
    },
    // 3
    {
      id: 6,
      user_id: 3,
      team_id: 3,
      owner: true,
    },
  ];
}

function makeUserBoardsArray() {
  return [
    // 1
    { id: 1, board_id: 1, user_id: 1, owner: true },
    { id: 2, board_id: 2, user_id: 1, owner: false },
    // 2
    { id: 3, board_id: 1, user_id: 2, owner: false },
    { id: 4, board_id: 2, user_id: 2, owner: true },
    { id: 5, board_id: 3, user_id: 2, owner: false },
    //3
    { id: 6, board_id: 3, user_id: 3, owner: true },
  ];
}

function makeBoardsArray() {
  return [
    {
      id: 1,
      name: 'Sales Retrio Board',
      team_id: 1,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 2,
      name: 'Leadership Retrio Board',
      team_id: 2,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 3,
      name: 'Accounting Retrio Board',
      team_id: 3,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
  ];
}

function makeExpectedBoard(board) {
  return {
    id: board.id,
    name: board.name,
    team_id: board.team_id,
    owner: board.owner,
    created_at: board.created_at.toISOString(),
    updated_at: board.updated_at.toISOString(),
  };
}

function makeMaliciousBoard(user) {
  const userBoard = {
    id: 1,
    board_id: 911,
    user_id: user.id,
    owner: false,
  };
  const maliciousBoard = {
    id: 911,
    name: `Naughty naughty very naughty <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    team_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };
  const expectedBoard = {
    ...makeExpectedBoard(maliciousBoard),
    name: `Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
    owner: userBoard.owner,
  };
  return {
    userBoard,
    maliciousBoard,
    expectedBoard,
  };
}

function makeBoardsFixtures() {
  const testUsers = makeUsersArray();
  const testTeams = makeTeamsArray();
  const testTeamMembers = makeTeamMembersArray();
  const testBoards = makeBoardsArray();
  const testUserBoards = makeUserBoardsArray();

  return { testUsers, testTeams, testTeamMembers, testBoards, testUserBoards };
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

function seedTeams(db, teams, teamMembers) {
  // use a transaction to group the queries and auto rollback on any failure
  return db.transaction(async (trx) => {
    await trx.into('teams').insert(teams);
    // update the auto sequence to match the forced id values
    await trx.raw(`SELECT setval('teams_id_seq', ?)`, [
      teams[teams.length - 1].id,
    ]);
    await trx.into('team_members').insert(teamMembers);
    // update the auto sequence to match the forced id values
    await trx.raw(`SELECT setval('user_boards_id_seq', ?)`, [
      teamMembers[teamMembers.length - 1].id,
    ]);
  });
}

function seedBoards(db, boards, userBoards) {
  // use a transaction to group the queries and auto rollback on any failure
  return db.transaction(async (trx) => {
    await trx.into('boards').insert(boards);
    // update the auto sequence to match the forced id values
    await trx.raw(`SELECT setval('boards_id_seq', ?)`, [
      boards[boards.length - 1].id,
    ]);
    await trx.into('user_boards').insert(userBoards);
    // update the auto sequence to match the forced id values
    await trx.raw(`SELECT setval('user_boards_id_seq', ?)`, [
      userBoards[userBoards.length - 1].id,
    ]);
  });
}

function cleanTable(db) {
  return db.transaction((trx) =>
    trx
      .raw(
        `TRUNCATE
        cards,
        user_boards,
        boards,
        team_members,
        teams,
        users
    `
      )
      .then(() =>
        Promise.all([
          trx.raw(`ALTER SEQUENCE cards_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE user_boards_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE boards_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE teams_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE users_id_seq minvalue 0 START WITH 1`),
          trx.raw(`SELECT setval('cards_id_seq', 0)`),
          trx.raw(`SELECT setval('user_boards_id_seq', 0)`),
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
  makeTeamsArray,
  makeTeamMembersArray,
  makeBoardsArray,
  makeUserBoardsArray,
  makeExpectedBoard,
  makeMaliciousBoard,
  makeBoardsFixtures,
  seedUsers,
  seedTeams,
  seedBoards,
  cleanTable,
  makeAuthHeader,
};
