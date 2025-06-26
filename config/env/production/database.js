module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      connectionString: env('DATABASE_URL'),
      ssl: env.bool('DATABASE_SSL', false) ? {
        rejectUnauthorized: false
      } : false,
    },
    acquireConnectionTimeout: 60000,
    pool: {
      min: 2,
      max: 10,
    },
  },
});