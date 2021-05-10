exports.seed = async function (knex) {
  // Delete table data
  await knex('cards').del();
  await knex('user_boards').del();
  await knex('boards').del();
  await knex('team_members').del();
  await knex('teams').del();
  await knex('users').del();
  // Reset users, teams, boards, and cards tables auto increment back to 1
  await knex.raw('ALTER SEQUENCE cards_id_seq RESTART WITH 1');
  await knex.raw('ALTER SEQUENCE user_boards_id_seq RESTART WITH 1');
  await knex.raw('ALTER SEQUENCE boards_id_seq RESTART WITH 1');
  await knex.raw('ALTER SEQUENCE team_members_id_seq RESTART WITH 1');
  await knex.raw('ALTER SEQUENCE teams_id_seq RESTART WITH 1');
  await knex.raw('ALTER SEQUENCE users_id_seq RESTART WITH 1');

  // Insert users into table
  await knex('users').insert([
    // 1
    {
      email: 'jim.halpert@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Jim',
      last_name: 'Halpert',
    },
    // 2
    {
      email: 'worldsbestboss@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Michael',
      last_name: 'Scott',
    },
    // 3
    {
      email: 'pam.beasley@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Pam',
      last_name: 'Beasley',
    },
    // 4
    {
      email: 'dwight.schrute@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
    },
    // 5
    {
      email: 'stanley.hudson@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Stanley',
    },
    // 6
    {
      email: 'ryan.howard@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Ryan',
      last_name: 'Howard',
    },
    // 7
    {
      email: 'kevin.malone@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Kevin',
      last_name: 'Malone',
    },
    // 8
    {
      email: 'angela.martin@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Angela',
      last_name: 'Martin',
    },
    // 9
    {
      email: 'oscar.martinez@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Oscar',
      last_name: 'Martinez',
    },
    // 10
    {
      email: 'andy.bernard@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Andy',
      last_name: 'Bernard',
    },
    // 11
    {
      email: 'toby.flenderson@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Toby',
      last_name: 'Flenderson',
    },
    // 12
    {
      email: 'creed.bratton@dundermifflin.com',
      password: '$2a$12$3ptOEuFVB/jRIcAQBP17JuPxAdIOij1OuEqBs88mXkRj5Sq8bCn7O',
      first_name: 'Creed',
    },
  ]);

  // Insert teams into table
  await knex('teams').insert([
    // 1
    {
      name: 'Sales',
    },
    // 2
    {
      name: 'Leadership',
    },
    // 3
    {
      name: 'Accounting',
    },
  ]);

  // Insert teams into table
  await knex('team_members').insert([
    // Sales team members
    {
      user_id: 1,
      team_id: 1,
      owner: true,
    },
    {
      user_id: 2,
      team_id: 1,
      owner: false,
    },
    {
      user_id: 3,
      team_id: 1,
      owner: false,
    },
    {
      user_id: 4,
      team_id: 1,
      owner: false,
    },
    {
      user_id: 5,
      team_id: 1,
      owner: false,
    },
    {
      user_id: 10,
      team_id: 1,
      owner: false,
    },
    {
      user_id: 11,
      team_id: 1,
      owner: false,
    },
    // Leadership team members
    {
      user_id: 1,
      team_id: 2,
      owner: true,
    },
    {
      user_id: 2,
      team_id: 2,
      owner: false,
    },
    {
      user_id: 3,
      team_id: 2,
      owner: false,
    },
    {
      user_id: 4,
      team_id: 2,
      owner: false,
    },
    {
      user_id: 6,
      team_id: 2,
      owner: false,
    },
    {
      user_id: 11,
      team_id: 2,
      owner: false,
    },
    // Accounting team members
    {
      user_id: 1,
      team_id: 3,
      owner: false,
    },
    {
      user_id: 2,
      team_id: 3,
      owner: false,
    },
    {
      user_id: 3,
      team_id: 3,
      owner: false,
    },
    {
      user_id: 6,
      team_id: 3,
      owner: false,
    },
    {
      user_id: 7,
      team_id: 3,
      owner: true,
    },
    {
      user_id: 8,
      team_id: 3,
      owner: false,
    },
    {
      user_id: 9,
      team_id: 3,
      owner: false,
    },
    {
      user_id: 11,
      team_id: 3,
      owner: false,
    },
  ]);

  // Insert boards into table
  await knex('boards').insert([
    // 1
    {
      name: 'Sales Retrio Board',
      team_id: 1,
    },
    // 2
    {
      name: 'Leadership Retrio Board',
      team_id: 2,
    },
    // 3
    {
      name: 'Accounting Retrio Board',
      team_id: 3,
    },
  ]);

  // Insert user_boards into table
  await knex('user_boards').insert([
    // 1
    {
      board_id: 1,
      user_id: 1,
      owner: true,
    },
    {
      board_id: 2,
      user_id: 1,
      owner: true,
    },
    {
      board_id: 3,
      user_id: 1,
      owner: false,
    },
    // 2
    {
      board_id: 1,
      user_id: 2,
      owner: false,
    },
    {
      board_id: 2,
      user_id: 2,
      owner: false,
    },
    {
      board_id: 3,
      user_id: 2,
      owner: false,
    },
    // 3
    {
      board_id: 1,
      user_id: 3,
      owner: false,
    },
    {
      board_id: 2,
      user_id: 3,
      owner: false,
    },
    {
      board_id: 3,
      user_id: 3,
      owner: false,
    },
    // 4
    {
      board_id: 1,
      user_id: 4,
      owner: false,
    },
    {
      board_id: 2,
      user_id: 4,
      owner: false,
    },
    // 5
    {
      board_id: 1,
      user_id: 5,
      owner: false,
    },
    // 6
    {
      board_id: 1,
      user_id: 6,
      owner: false,
    },
    {
      board_id: 2,
      user_id: 6,
      owner: false,
    },
    {
      board_id: 3,
      user_id: 6,
      owner: false,
    },
    // 7
    {
      board_id: 3,
      user_id: 7,
      owner: false,
    },
    // 8
    {
      board_id: 3,
      user_id: 8,
      owner: false,
    },
    // 9
    {
      board_id: 3,
      user_id: 9,
      owner: true,
    },
    // 10
    {
      board_id: 1,
      user_id: 10,
      owner: false,
    },
    // 11
    {
      board_id: 1,
      user_id: 11,
      owner: false,
    },
    {
      board_id: 2,
      user_id: 11,
      owner: false,
    },
    {
      board_id: 3,
      user_id: 11,
      owner: false,
    },
    // 12 - No Board user
  ]);

  // Insert cards into table
  await knex('cards').insert([
    // Board 1 cards
    {
      category: 1,
      headline: 'We sold a lot of paper!',
      text:
        'Thanks to Stanley who landed that huge sale, we moved a lot of paper this month. Keep it up folks!',
      board_id: 1,
      created_by: 1,
    },
    {
      category: 1,
      text: "Dwight's stapler got Jell-o molded LOL",
      board_id: 1,
      created_by: 3,
    },
    {
      category: 1,
      headline: 'WE STUCK IT TO STAMFORD BRANCH',
      text: `They can't even touch us! Stamford once again went down in sales. Let's go egg their building, guys!`,
      board_id: 1,
      created_by: 2,
    },
    {
      category: 1,
      headline: 'I am in love with Angela!',
      text: `We had the most amazing first date! I serenaded her and she loved it.`,
      board_id: 1,
      created_by: 10,
    },
    {
      category: 2,
      headline: 'I grilled my foot on my George Foreman grill!',
      text:
        'I was trying to wake up to the smell of cooking bacon and I grilled my foot. Dwight had to rescue me... IT WAS THE WORST.',
      board_id: 1,
      created_by: 2,
    },
    {
      category: 2,
      headline: 'My stapler was defiled',
      text: `Whoever defiled my stapler by putting in to a Jell-o mold, I'll have you know that I will find you.

I WILL HUNT YOU DOWN!
`,
      board_id: 1,
      created_by: 4,
    },
    {
      category: 3,
      headline: 'Friendly reminder',
      text: `Let's try to not have relationship's with our co-workers.

Thanks,
HR`,
      board_id: 1,
      created_by: 11,
    },
    {
      category: 4,
      headline: 'Thanks Michael',
      text:
        "I can't believe I am saying this right now, but thanks for stepping in on that sale Michael.",
      board_id: 1,
      created_by: 5,
    },
    {
      category: 4,
      headline: 'Stanley kicked some serious booty',
      text: 'Great job on moving those 200 boxes to the school district!',
      board_id: 1,
      created_by: 2,
    },
    {
      category: 4,
      headline: `Andy you're amazing`,
      text: 'Congrats on your first date!',
      board_id: 1,
      created_by: 10,
    },
    // Board 2 cards
    {
      category: 1,
      headline: 'A lot of paper was moved',
      text: `Thanks to Stanley who landed that huge sale, we moved a lot of paper this month. Keep it up or we'll shut down the branch`,
      board_id: 2,
      created_by: 6,
    },
    {
      category: 1,
      text: "Jim Jell-o molded Dwight's stapler for me LOL",
      board_id: 1,
      created_by: 2,
    },
    {
      category: 2,
      text: `Budding romance in the office. We should not encourage this, Michael...`,
      board_id: 2,
      created_by: 11,
    },
    {
      category: 2,
      headline: `That's not funny Michael`,
      text: `You can't allow these pranks to continue or I will have to respond with deadly force!`,
      board_id: 2,
      created_by: 4,
    },
    {
      category: 3,
      headline: `Sell more paper`,
      text: `I need a promotion guys.
Let's work on building up our internet preseence. It's the future of this company against the big box retailers.`,
      board_id: 2,
      created_by: 6,
    },
    {
      category: 3,
      headline: `Punishing prankers!`,
      text: `Let me punish them, Michael. They'll never want to prank again`,
      board_id: 2,
      created_by: 4,
    },
    {
      category: 3,
      text: `Team, I am serious, if we can come up with a way to cook bacon right as you wake up, everyone would be so much happier!`,
      board_id: 2,
      created_by: 2,
    },
    {
      category: 4,
      headline: `Congratulations Pam`,
      text: `I couldn't be more proud of you for graduating art school. You're amazing and I know you'll go places.
      
Love,
Jim`,
      board_id: 2,
      created_by: 1,
    },
    // Board 3 cards
    {
      category: 1,
      headline: `I got chicken nuggets`,
      text: `I was so hungry, guys. These chicken nuggets are so tasty. What's your favorite dip for them? I like ranch.`,
      board_id: 3,
      created_by: 7,
    },
    {
      category: 1,
      headline: `My cat cam setup!`,
      text: `Now I do not have to worry about my cats while at work. I can check in on them any moment of the day!`,
      board_id: 3,
      created_by: 8,
    },
    {
      category: 2,
      headline: `I can't stand my team.`,
      text: `Sigh... All they talk about is food and cats.`,
      board_id: 3,
      created_by: 9,
    },
    {
      category: 2,
      headline: `Oscar hates us`,
      text: `Some times I feel like Oscar HATES us. I don't know why? Who doesn't like talking about food???`,
      board_id: 3,
      created_by: 7,
    },
    {
      category: 4,
      headline: `YOU GUYS ARE AMAZING`,
      text: `I LOVE YOU ALL`,
      board_id: 3,
      created_by: 2,
    },
  ]);
};
