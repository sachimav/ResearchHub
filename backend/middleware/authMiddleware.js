import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing." });
    }

    const secret = process.env.JWT_SECRET || "researchhub-dev-secret";
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to access this resource." });
  }

  return next();
};
