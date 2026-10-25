import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || ["researchhub-secret-key", "researchhub-dev-secret"].includes(secret)) {
    throw new Error("Set JWT_SECRET to a random secret of at least 32 characters.");
  }
  return secret;
};
