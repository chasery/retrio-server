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

function makeCardsArray() {
  return [
    // Board 1 cards
    {
      id: 1,
      category: 1,
      headline: 'We sold a lot of paper!',
      text:
        'Thanks to Stanley who landed that huge sale, we moved a lot of paper this month. Keep it up folks!',
      board_id: 1,
      created_by: 1,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 2,
      category: 2,
      headline: 'My stapler was defiled',
      text: `Whoever defiled my stapler by putting in to a Jell-o mold, I'll have you know that I will find you.

I WILL HUNT YOU DOWN!
`,
      board_id: 1,
      created_by: 2,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 3,
      category: 4,
      headline: 'Thanks Michael',
      text:
        "I can't believe I am saying this right now, but thanks for stepping in on that sale Michael.",
      board_id: 1,
      created_by: 2,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
    // Board 2 cards
    {
      id: 4,
      category: 1,
      headline: 'A lot of paper was moved',
      text: `Thanks to Stanley who landed that huge sale, we moved a lot of paper this month. Keep it up or we'll shut down the branch`,
      board_id: 2,
      created_by: 2,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 5,
      category: 3,
      headline: `Sell more paper`,
      text: `I need a promotion guys.
Let's work on building up our internet preseence. It's the future of this company against the big box retailers.`,
      board_id: 2,
      created_by: 2,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 6,
      category: 4,
      headline: `Congratulations Pam`,
      text: `I couldn't be more proud of you for graduating art school. You're amazing and I know you'll go places.
      
Love,
Jim`,
      board_id: 2,
      created_by: 1,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
    // Board 3 cards
    {
      id: 7,
      category: 1,
      headline: `My cat cam setup!`,
      text: `Now I do not have to worry about my cats while at work. I can check in on them any moment of the day!`,
      board_id: 3,
      created_by: 3,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 8,
      category: 2,
      headline: `I can't stand my team.`,
      text: `Sigh... All they talk about is food and cats.`,
      board_id: 3,
      created_by: 3,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 9,
      category: 4,
      headline: `YOU GUYS ARE AMAZING`,
      text: `I LOVE YOU ALL`,
      board_id: 3,
      created_by: 2,
      created_at: new Date('2029-01-22T16:28:32.615Z'),
      updated_at: new Date('2029-01-22T16:28:32.615Z'),
    },
  ];
}

function makeExpectedBoard(board, cards) {
  let expectedBoard = {
    id: board.id,
    name: board.name,
    owner: board.owner,
  };

  if (board.created_at && board.updated_at) {
    expectedBoard = {
      ...expectedBoard,
      created_at: board.created_at.toISOString(),
      updated_at: board.updated_at.toISOString(),
    };
  }

  if (cards) {
    expectedBoard = {
      ...expectedBoard,
      cards,
    };
  }

  return expectedBoard;
}

function makeExpectedCard(user, card) {
  const expectedUser = {
    user_id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
  };

  return {
    card_id: card.id,
    category: card.category,
    headline: card.headline,
    text: card.text,
    created_at: card.created_at.toISOString(),
    updated_at: card.updated_at.toISOString(),
    user: expectedUser,
  };
}

function makeMaliciousBoard(user, cards) {
  const userBoard = {
    id: 1,
    board_id: 911,
    user_id: user.id,
    owner: false,
  };
  let maliciousBoard;
  let expectedBoard;

  if (!cards) {
    maliciousBoard = {
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  maliciousBoard = {
    ...maliciousBoard,
    id: 911,
    name: `Naughty naughty very naughty <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    team_id: 1,
  };
  expectedBoard = {
    ...makeExpectedBoard(maliciousBoard),
    name: `Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
    owner: userBoard.owner,
  };

  if (cards) {
    expectedBoard = {
      ...expectedBoard,
      cards,
    };
  }

  return {
    userBoard,
    maliciousBoard,
    expectedBoard,
  };
}

function makeMaliciousCard(user) {
  const maliciousCard = {
    id: 911,
    category: 1,
    board_id: 911,
    headline: 'Naughty naughty very naughty <script>alert("xss");</script>',
    text: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: user.id,
  };
  const expectedCard = {
    ...makeExpectedCard(user, maliciousCard),
    headline:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    text: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  };
  return {
    maliciousCard,
    expectedCard,
  };
}

function makeBoardsFixtures() {
  const testUsers = makeUsersArray();
  const testTeams = makeTeamsArray();
  const testTeamMembers = makeTeamMembersArray();
  const testBoards = makeBoardsArray();
  const testUserBoards = makeUserBoardsArray();
  const testCards = makeCardsArray();

  return {
    testUsers,
    testTeams,
    testTeamMembers,
    testBoards,
    testUserBoards,
    testCards,
  };
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

function seedBoards(db, boards, userBoards, cards) {
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
    if (cards) {
      await trx.into('cards').insert(cards);
      // update the auto sequence to match the forced id values
      await trx.raw(`SELECT setval('cards_id_seq', ?)`, [
        cards[cards.length - 1].id,
      ]);
    }
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
  makeCardsArray,
  makeExpectedBoard,
  makeExpectedCard,
  makeMaliciousBoard,
  makeMaliciousCard,
  makeBoardsFixtures,
  seedUsers,
  seedTeams,
  seedBoards,
  cleanTable,
  makeAuthHeader,
};
