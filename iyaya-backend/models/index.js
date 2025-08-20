// models/index.js
const mongoose = require('mongoose');
const User = require('./User');  // Mongoose model
const Booking = require('./Booking');
const Job = require('./Job');
const Application = require('./Application');

// For Sequelize models (like AuditLog), you'll need to handle them differently
// since they require sequelize instance and DataTypes

module.exports = {
  // Mongoose Models
  User,
  Booking,
  Job,
  Application,
  
  // Sequelize Models - these will be initialized separately
  // Note: AuditLog needs to be initialized with sequelize instance
  initSequelizeModels: (sequelize, DataTypes) => {
    const AuditLog = require('./AuditLog')(sequelize, DataTypes);
    return {
      AuditLog
      // Add other Sequelize models here
    };
  }
};