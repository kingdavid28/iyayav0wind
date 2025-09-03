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

    // Map synonyms to canonical categories
    const synonyms = {
      parent: new Set(['parent', 'client']),
      caregiver: new Set(['provider', 'caregiver'])
    };

    const normalize = (t) => {
      if (!t || typeof t !== 'string') return undefined;
      const v = t.toLowerCase();
      if (synonyms.parent.has(v)) return 'parent';
      if (synonyms.caregiver.has(v)) return 'caregiver';
      return v; // fallback: unknown type stays as-is
    };

    // Build allowed set including synonyms
    const rawAllowed = Array.isArray(allowedType) ? allowedType : [allowedType];
    const allowedSet = new Set();
    for (const t of rawAllowed) {
      const norm = normalize(t);
      allowedSet.add(t);
      if (norm) {
        allowedSet.add(norm);
        // include all synonyms for the normalized group
        if (norm === 'parent') synonyms.parent.forEach((x) => allowedSet.add(x));
        if (norm === 'caregiver') synonyms.caregiver.forEach((x) => allowedSet.add(x));
      }
    }

    const userTypeNorm = normalize(req.user.userType);

    // If allowedType is an array, check if user's type is included
    // If it's a string, check for direct match
    const isAllowed = allowedSet.has(req.user.userType) || (userTypeNorm && allowedSet.has(userTypeNorm));

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: ${req.user.userType || 'unknown'} cannot access this resource`,
        statusCode: 403
      });
    }

    next();
  };
};

module.exports = { checkUserType };