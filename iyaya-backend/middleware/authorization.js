// middleware/authorization.js
const checkUserType = (allowedType) => {
  return (req, res, next) => {
    // Check if user is authenticated and has the required userType
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Please log in first',
        statusCode: 401
      });
    }

    // If allowedType is an array, check if user's type is included
    // If it's a string, check for direct match
    const isAllowed = Array.isArray(allowedType)
      ? allowedType.includes(req.user.userType)
      : req.user.userType === allowedType;

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: ${req.user.userType} cannot access this resource`,
        statusCode: 403
      });
    }

    next();
  };
};

module.exports = { checkUserType };