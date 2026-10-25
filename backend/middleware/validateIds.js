import mongoose from "mongoose";

export const validateIds = (req, res, next) => {
  for (const [name, value] of Object.entries(req.params)) {
    if (name.endsWith("Id") && !mongoose.isValidObjectId(value)) return res.status(400).json({ message: `${name} must be a valid ID.` });
  }
  return next();
};
