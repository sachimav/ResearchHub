import mongoose from "mongoose";

const connectDB = async (options = {}) => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not defined in the environment.");
    }

    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000, autoIndex: process.env.NODE_ENV !== "production", ...options });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);

    throw error;
  }
};

export default connectDB;
