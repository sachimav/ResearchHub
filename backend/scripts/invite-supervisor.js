import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env.js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[a-z0-9._%+-]+@vau\.ac\.lk$/.test(email)) {
  throw new Error("Usage: npm run invite:supervisor -- lecturer@vau.ac.lk");
}
console.log(jwt.sign({ email }, getJwtSecret(), {
  algorithm: "HS256", audience: "researchhub-registration", expiresIn: "48h",
}));
