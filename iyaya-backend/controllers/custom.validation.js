const Joi = require('joi');
const { regEx } = require('../config/constants');

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('Password must be at least 8 characters');
  }
  if (!value.match(regEx.password)) {
    return helpers.message(
      'Password must contain at least 1 letter, 1 number, and 1 special character'
    );
  }
  return value;
};

const objectId = (value, helpers) => {
  if (!value.match(regEx.objectId)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

module.exports = {
  password,
  objectId,
};