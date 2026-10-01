import express from "express";
<<<<<<< Updated upstream
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";

const app = express();
app.use(bodyParser.json());
dotenv.config();
const PORT = process.env.PORT || 8000;
const MONGOURL = process.env.MONGO_URL;


mongoose.connect(MONGOURL).then(() => {
    console.log("Database connected successfully.");
    app.listen(PORT, () => {
    console.log(`Server is running on port : ${PORT}`);
    });
}).catch((error) => console.log(error));}).catch((error) => console.log(error));
=======
import cors from "cors";

import studentRoutes from "./routes/studentRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

const app = express();

// Allow the Vite frontend (React) to call this API
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/rh/student", studentRoutes);
app.use("/rh/public", publicRoutes);

export default app;
>>>>>>> Stashed changes
