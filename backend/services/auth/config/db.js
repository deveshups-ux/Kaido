import mongoose from "mongoose";

const connectDb = async () => {
  try {
    console.log("URI:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("db connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default connectDb;
