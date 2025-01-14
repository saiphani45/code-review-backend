import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Connecting the server to the mongoDB
const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI!);
    console.log(`MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
