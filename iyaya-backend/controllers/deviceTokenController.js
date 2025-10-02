const DeviceToken = require('../models/DeviceToken');

const resolveUserId = (req) => req.user?.mongoId || req.user?.id;

exports.upsertDeviceToken = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { token, platform = 'unknown' } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Device token is required',
      });
    }

    const sanitizedPlatform = ['ios', 'android', 'web', 'unknown'].includes(platform)
      ? platform
      : 'unknown';

    const record = await DeviceToken.findOneAndUpdate(
      { token },
      { userId, token, platform: sanitizedPlatform },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Device token upsert error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register device token',
    });
  }
};

exports.removeDeviceToken = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { token } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (token) {
      await DeviceToken.deleteOne({ userId, token });
    } else {
      await DeviceToken.deleteMany({ userId });
    }

    return res.status(200).json({
      success: true,
      message: 'Device token removed',
    });
  } catch (error) {
    console.error('Device token removal error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove device token',
    });
  }
};
