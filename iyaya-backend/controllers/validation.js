const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    // Accept frontend role aliases; controller will normalize to internal values
    role: Joi.string().valid('user', 'admin', 'provider', 'client', 'parent', 'caregiver', 'nanny'),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

// Map of available schemas for easier lookup
const schemas = {
  register,
  login,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
};

// Middleware factory to validate requests based on schema name
const validate = (name) => {
  const schema = schemas[name];
  // If schema not found, pass-through to avoid breaking routes
  if (!schema) return (req, res, next) => next();

  return async (req, res, next) => {
    try {
      const options = { abortEarly: false, stripUnknown: true };
      if (schema.params) {
        req.params = await schema.params.validateAsync(req.params, options);
      }
      if (schema.query) {
        req.query = await schema.query.validateAsync(req.query, options);
      }
      if (schema.body) {
        req.body = await schema.body.validateAsync(req.body, options);
      }
      next();
    } catch (err) {
      const details = err?.details?.map((d) => d.message) || [err.message];
      res.status(400).json({ success: false, error: 'Validation error', details });
    }
  };
};

module.exports = {
  register,
  login,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  validate,
};