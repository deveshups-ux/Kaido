import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoose from "mongoose";

// Routes & Middleware
import authRoutes from "./services/auth/routes/auth.route.js";
import chatRoutes from "./services/chat/routes/chat.routes.js";
import billingRoutes from "./services/billing/routes/billing.route.js";
import agentRoutes from "./services/agent/routes/agent.route.js";
import protect from "./gateway/middleware/auth.middleware.js";
import { getCurrentUser } from "./gateway/controllers/user.controller.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Connect MongoDB
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected successfully");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};
connectDB();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.includes("vercel.app") || origin.includes("localhost") || origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());

// Mount All Microservice Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", protect, chatRoutes);
app.use("/api/billing", protect, billingRoutes);
app.use("/api/agent", protect, agentRoutes);
app.get("/api/me", protect, getCurrentUser);

app.get("/", (req, res) => {
  res.json({ message: "Kaido Multi-Agent Backend is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  if (err.status) {
    return res.status(err.status).json(err.data || { message: err.message });
  }
  return res
    .status(500)
    .json({ message: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Kaido Unified Backend is running on port ${PORT}`);
});
