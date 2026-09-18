import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import router from "./routes/billing.route.js";
const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/", router);
app.get("/", (req, res) => {
  res.json({ message: "Billing service is running" });
});

app.listen(PORT, () => {
  console.log(`Billing service is running on port ${PORT}`);
  connectDb();
});
