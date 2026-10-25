import { getJwtSecret } from "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";

const startServer = async () => {
  getJwtSecret();
  await connectDB();

  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exitCode = 1;
});
