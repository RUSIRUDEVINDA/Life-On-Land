const getRoleFromRequest = (req) => {
  const role = req.headers["x-role"];
  return typeof role === "string" ? role.toUpperCase() : "RANGER";
};

const allowRoles = (roles) => (req, res, next) => {
  const role = getRoleFromRequest(req);
  if (!roles.includes(role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  req.userRole = role;
  return next();
};

export {
  allowRoles,
  getRoleFromRequest,
};
