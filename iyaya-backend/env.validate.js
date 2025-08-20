const envalid = require('envalid');

module.exports = envalid.cleanEnv(process.env, {
  NODE_ENV: envalid.str({ choices: ['development', 'production'] }),
  MONGODB_URI: envalid.str(),
  JWT_SECRET: envalid.str(),
  // Add validation for all other variables
});