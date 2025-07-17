const roleAuth = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No user found.' });
    }

    // Convert single role to array for consistency
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Specific role checkers
const requireAdmin = roleAuth('admin');
const requireEmployee = roleAuth(['admin', 'employee']);
const requireAdminOnly = roleAuth('admin');

module.exports = {
  roleAuth,
  requireAdmin,
  requireEmployee,
  requireAdminOnly
}; 