import dotenv from "dotenv";
dotenv.config();
import express from "express";
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";
import protect from "./middleware/auth.middleware.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import morgan from "morgan";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,  
  }),
);
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/auth", proxy(process.env.AUTH_SERVICE));
app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE));
app.use("/api/agent", protect, proxy(process.env.AGENT_SERVICE));
app.get("/api/me", protect, getCurrentUser);
app.get("/", (req, res) => {
  res.json({ message: "Gateway is running" });
});

app.listen(PORT, () => {
  console.log(`Gateway is running on port ${PORT}`);
});
