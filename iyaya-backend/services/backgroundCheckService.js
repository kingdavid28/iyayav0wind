const axios = require('axios');
const { logger } = require('../utils/logger');
const Caregiver = require('../models/Caregiver');
const User = require('../models/User');

class BackgroundCheckService {
  constructor() {
    this.apiKey = process.env.BACKGROUND_CHECK_API_KEY;
    this.apiUrl = process.env.BACKGROUND_CHECK_API_URL || 'https://api.backgroundcheck.com/v1';
    this.webhookSecret = process.env.BACKGROUND_CHECK_WEBHOOK_SECRET;
  }

  /**
   * Request a background check for a caregiver
   * @param {string} caregiverId - Caregiver's MongoDB ID
   * @param {Object} personalInfo - Personal information for background check
   */
  async requestBackgroundCheck(caregiverId, personalInfo) {
    try {
      const caregiver = await Caregiver.findById(caregiverId).populate('userId');
      if (!caregiver) {
        throw new Error('Caregiver not found');
      }

      // Prepare background check request
      const checkRequest = {
        candidate: {
          first_name: personalInfo.firstName || caregiver.name.split(' ')[0],
          last_name: personalInfo.lastName || caregiver.name.split(' ').slice(1).join(' '),
          email: caregiver.userId.email,
          phone: caregiver.userId.phone,
          date_of_birth: personalInfo.dateOfBirth,
          ssn: personalInfo.ssn, // For US-based checks
          address: personalInfo.address,
        },
        package: 'childcare_comprehensive', // Custom package for childcare caregivers
        checks: [
          'criminal_history',
          'identity_verification',
          'employment_history',
          'education_verification',
          'reference_check',
          'sex_offender_registry'
        ],
        callback_url: `${process.env.API_BASE_URL}/api/webhooks/background-check`,
        metadata: {
          caregiver_id: caregiverId,
          user_id: caregiver.userId._id.toString()
        }
      };

      // Make API request to background check service
      const response = await axios.post(`${this.apiUrl}/checks`, checkRequest, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      // Update caregiver record
      await Caregiver.findByIdAndUpdate(caregiverId, {
        'backgroundCheck.status': 'pending',
        'backgroundCheck.provider': 'third_party_service',
        'backgroundCheck.requestedAt': new Date(),
        'backgroundCheck.reportId': response.data.id,
        'backgroundCheck.checkTypes': checkRequest.checks
      });

      logger.info(`Background check requested for caregiver ${caregiverId}`, {
        reportId: response.data.id,
        caregiverId
      });

      return {
        success: true,
        reportId: response.data.id,
        status: 'pending',
        estimatedCompletion: response.data.estimated_completion_date
      };

    } catch (error) {
      logger.error('Background check request failed:', {
        caregiverId,
        error: error.message,
        stack: error.stack
      });

      // Update caregiver record with error status
      await Caregiver.findByIdAndUpdate(caregiverId, {
        'backgroundCheck.status': 'rejected',
        'backgroundCheck.notes': `Request failed: ${error.message}`
      });

      throw new Error(`Background check request failed: ${error.message}`);
    }
  }

  /**
   * Handle background check webhook callback
   * @param {Object} payload - Webhook payload from background check service
   */
  async handleWebhookCallback(payload) {
    try {
      const { id: reportId, status, results, metadata } = payload;
      const caregiverId = metadata.caregiver_id;

      if (!caregiverId) {
        throw new Error('Caregiver ID not found in webhook payload');
      }

      const caregiver = await Caregiver.findById(caregiverId);
      if (!caregiver) {
        throw new Error(`Caregiver ${caregiverId} not found`);
      }

      // Map external status to internal status
      const statusMapping = {
        'completed': 'approved',
        'failed': 'rejected',
        'pending': 'in_progress',
        'cancelled': 'rejected'
      };

      const internalStatus = statusMapping[status] || 'pending';
      const updateData = {
        'backgroundCheck.status': internalStatus,
        'backgroundCheck.completedAt': new Date()
      };

      // Process results if check is completed
      if (status === 'completed' && results) {
        const hasIssues = this.analyzeBackgroundCheckResults(results);
        
        if (hasIssues) {
          updateData['backgroundCheck.status'] = 'rejected';
          updateData['backgroundCheck.notes'] = 'Background check revealed concerning information';
        } else {
          updateData['backgroundCheck.status'] = 'approved';
          updateData['backgroundCheck.verifiedAt'] = new Date();
          
          // Add verification badge
          if (!caregiver.verification.badges.includes('background_checked')) {
            updateData['verification.badges'] = [...caregiver.verification.badges, 'background_checked'];
          }
          
          // Update trust score
          updateData['verification.trustScore'] = caregiver.calculateTrustScore();
        }
      }

      await Caregiver.findByIdAndUpdate(caregiverId, updateData);

      logger.info(`Background check webhook processed for caregiver ${caregiverId}`, {
        reportId,
        status: internalStatus,
        caregiverId
      });

      return { success: true };

    } catch (error) {
      logger.error('Background check webhook processing failed:', {
        error: error.message,
        payload
      });
      throw error;
    }
  }

  /**
   * Analyze background check results for red flags
   * @param {Object} results - Background check results
   * @returns {boolean} - True if there are concerning issues
   */
  analyzeBackgroundCheckResults(results) {
    const redFlags = [
      'violent_crime',
      'child_abuse',
      'sex_offense',
      'drug_trafficking',
      'identity_fraud'
    ];

    // Check criminal history
    if (results.criminal_history && results.criminal_history.records) {
      for (const record of results.criminal_history.records) {
        if (redFlags.some(flag => record.offense_type?.toLowerCase().includes(flag))) {
          return true;
        }
        
        // Check for recent convictions (within 7 years)
        const convictionDate = new Date(record.conviction_date);
        const sevenYearsAgo = new Date();
        sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
        
        if (convictionDate > sevenYearsAgo && record.severity === 'felony') {
          return true;
        }
      }
    }

    // Check sex offender registry
    if (results.sex_offender_registry && results.sex_offender_registry.found) {
      return true;
    }

    // Check identity verification
    if (results.identity_verification && !results.identity_verification.verified) {
      return true;
    }

    return false;
  }

  /**
   * Get background check status for a caregiver
   * @param {string} caregiverId - Caregiver's MongoDB ID
   */
  async getBackgroundCheckStatus(caregiverId) {
    try {
      const caregiver = await Caregiver.findById(caregiverId).select('backgroundCheck verification');
      if (!caregiver) {
        throw new Error('Caregiver not found');
      }

      return {
        status: caregiver.backgroundCheck.status,
        requestedAt: caregiver.backgroundCheck.requestedAt,
        completedAt: caregiver.backgroundCheck.completedAt,
        verifiedAt: caregiver.backgroundCheck.verifiedAt,
        reportId: caregiver.backgroundCheck.reportId,
        trustScore: caregiver.verification.trustScore,
        badges: caregiver.verification.badges
      };

    } catch (error) {
      logger.error('Get background check status failed:', {
        caregiverId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Manually approve/reject background check (admin function)
   * @param {string} caregiverId - Caregiver's MongoDB ID
   * @param {string} status - 'approved' or 'rejected'
   * @param {string} adminId - Admin user ID
   * @param {string} notes - Optional notes
   */
  async manualReview(caregiverId, status, adminId, notes = '') {
    try {
      const caregiver = await Caregiver.findById(caregiverId);
      if (!caregiver) {
        throw new Error('Caregiver not found');
      }

      const updateData = {
        'backgroundCheck.status': status,
        'backgroundCheck.verifiedBy': adminId,
        'backgroundCheck.verifiedAt': new Date(),
        'backgroundCheck.notes': notes
      };

      if (status === 'approved') {
        // Add verification badge
        if (!caregiver.verification.badges.includes('background_checked')) {
          updateData['verification.badges'] = [...caregiver.verification.badges, 'background_checked'];
        }
        
        // Update trust score
        updateData['verification.trustScore'] = caregiver.calculateTrustScore();
      }

      await Caregiver.findByIdAndUpdate(caregiverId, updateData);

      logger.info(`Background check manually reviewed for caregiver ${caregiverId}`, {
        status,
        adminId,
        caregiverId
      });

      return { success: true };

    } catch (error) {
      logger.error('Manual background check review failed:', {
        caregiverId,
        status,
        adminId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new BackgroundCheckService();
