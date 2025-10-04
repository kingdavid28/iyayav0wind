// services/auditService.js
const db = require('../models');
const { AuditLog } = db;
const AUDIT_ENABLED = process.env.AUDIT_ENABLED === 'true';
let warnedAuditUnavailable = false;

const auditService = {
  /**
   * Log security-related events with comprehensive error handling
   * @param {string} eventType - Type of security event
   * @param {Object} metadata - Additional event data
   * @param {string} [userId] - Optional user ID
   * @returns {Promise<void>}
   */
  logSecurityEvent: async (eventType, metadata, userId = null) => {
    try {
      // 1. Console logging (always enabled)
      console.log(`[SECURITY][${new Date().toISOString()}] ${eventType}`, {
        userId,
        ...metadata
      });

      // 2. Database logging (if AuditLog model available)
      if (AuditLog?.create) {
        try {
          await AuditLog.create({
            userId,
            action: `SECURITY_${eventType}`,
            entity: 'SYSTEM',
            status: metadata.error ? 'FAILED' : 'SUCCESS',
            metadata: {
              ...metadata,
              eventType
            },
            timestamp: new Date(),
            ipAddress: metadata.ip,
            userAgent: metadata.userAgent
          });
        } catch (dbError) {
          console.error('[AUDIT_DB_ERROR] Failed to save security event:', {
            error: dbError.message,
            eventType,
            userId
          });
        }
      }

      // 3. External monitoring (example for Sentry)
      // if (process.env.SENTRY_DSN && metadata.error) {
      //   Sentry.captureException(metadata.error);
      // }
    } catch (error) {
      console.error('[AUDIT_SYSTEM_ERROR] Critical logging failure:', {
        error: error.message,
        eventType,
        userId,
        originalMetadata: metadata
      });
    }
  },

  /**
   * Log general application actions
   * @param {Object} params - Action parameters
   * @param {string} params.userId - User ID
   * @param {string} params.action - Action type
   * @param {string} [params.entity] - Affected entity
   * @param {string} [params.entityId] - Entity ID
   * @param {Object} [params.metadata] - Additional data
   * @param {string} [params.ipAddress] - IP address
   * @param {string} [params.userAgent] - User agent
   * @param {string} [params.status] - Action status
   * @returns {Promise<AuditLog|null>}
   */
  logAction: async ({
    userId,
    action,
    entity = null,
    entityId = null,
    metadata = {},
    ipAddress = null,
    userAgent = null,
    status = 'SUCCESS'
  }) => {
    try {
      if (!AuditLog?.create) {
        // If auditing is disabled, silently skip to avoid noisy logs in dev
        if (!AUDIT_ENABLED) return null;
        // If auditing is enabled but model isn't wired, warn once
        if (!warnedAuditUnavailable) {
          console.warn('[AUDIT_WARN] AuditLog model not available; skipping DB write for action:', action);
          warnedAuditUnavailable = true;
        }
        return null;
      }

      return await AuditLog.create({
        userId,
        action,
        entity,
        entityId,
        metadata,
        ipAddress,
        userAgent,
        status,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[AUDIT_ERROR] Failed to log action:', {
        error: error.message,
        action,
        userId,
        entity,
        entityId
      });
      
      return null;
    }
  },

  /**
   * Legacy log method for backward compatibility
   * @param {Object} params - Log parameters
   * @returns {Promise<AuditLog|null>}
   */
  log: async (params) => {
    return await auditService.logAction(params);
  },

  /**
   * Search audit logs with filters and pagination
   * (Keep your existing implementation here)
   */
  searchLogs: async (options) => {
    /* ... existing implementation ... */
  },

  /**
   * Purge old logs
   * (Keep your existing implementation here)
   */
  purgeLogs: async (options) => {
    /* ... existing implementation ... */
  },

  /**
   * Get audit log by ID
   * (Keep your existing implementation here)
   */
  getById: async (id) => {
    /* ... existing implementation ... */
  },

  /**
   * Get entity history
   * (Keep your existing implementation here)
   */
  getEntityHistory: async (entity, entityId, limit = 20) => {
    /* ... existing implementation ... */
  }
};

// Backwards-compatible helper so controllers can call logActivity(event, metadata)
// It proxies to logAction with reasonable defaults
async function logActivity(action, metadata = {}) {
  try {
    await auditService.logAction({
      userId: metadata.userId || null,
      action,
      entity: metadata.entity || 'SYSTEM',
      entityId: metadata.entityId || null,
      metadata,
      status: metadata.error ? 'FAILED' : 'SUCCESS'
    });
  } catch (e) {
    // Already logged inside logAction
  }
}

module.exports = Object.assign(auditService, { logActivity });