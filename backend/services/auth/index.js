import dotenv from "dotenv";
import express from "express";
import connectDb from "./config/db.js";
import router from "./routes/auth.route.js";
dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.use("/", router);

app.get("/", (req, res) => {
  res.json({ message: "Auth service is running" });
});

app.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`);
  connectDb();
});
