import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDb from "./config/db.js";
const PORT = process.env.PORT || 3000;
const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Auth service is running" });
});

app.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`);
  connectDb();
});
