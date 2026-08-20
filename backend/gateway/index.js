import dotenv from "dotenv";
dotenv.config();
import express from "express";
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(cookieParser());

app.use("/auth", proxy(process.env.AUTH_SERVICE));
app.get("/", (req, res) => {
  res.json({ message: "Gateway is running" });
});

app.listen(PORT, () => {
  console.log(`Gateway is running on port ${PORT}`);
});
