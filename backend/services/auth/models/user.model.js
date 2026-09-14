import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
    },
    username: {
      type: String,
      required: false,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      type: String,
    },
    plan: {
      type: String,
      default: "free",
    },
    credits: {
      type: Number,
      default: 100,
    },
    totalCredits: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true },
);
const User = mongoose.model("User", userSchema);
export default User;
