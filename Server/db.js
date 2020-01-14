const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'koralle',
  password: 'koralle',
  post: 5432
});

module.exports = pool