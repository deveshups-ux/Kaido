import dotenv from "dotenv";
import express from "express";
import connectDb from "./config/db.js";

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "AGENT service is running" });
});

app.listen(PORT, () => {
  console.log(`AGENT service is running on port ${PORT}`);
  connectDb();
});
