module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiry: process.env.JWT_EXPIRE,
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRE || '90d',
  cookieExpiry: process.env.JWT_COOKIE_EXPIRE
};