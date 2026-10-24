import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import app from "./app.js";
import connectDB from "./config/db.js";
import { seedDatabase } from "./config/seed.js";

dotenv.config({
  path: fileURLToPath(new URL("./.env", import.meta.url)),
});

const startServer = async () => {
  await connectDB();
  await seedDatabase();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();