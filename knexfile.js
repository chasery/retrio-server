require('dotenv').config();
const { DATABASE_URL, TEST_DATABASE_URL } = require('./src/config');

module.exports = {
  production: {
    client: 'pg',
    connection: DATABASE_URL,
    migrations: {
      directory: './migrations',
    },
  },
  development: {
    client: 'pg',
    connection: DATABASE_URL,
    migrations: {
      directory: './migrations',
    },
  },
  test: {
    client: 'pg',
    connection: TEST_DATABASE_URL,
    migrations: {
      directory: './migrations',
    },
  },
};
