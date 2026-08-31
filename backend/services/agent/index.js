import "dotenv/config";
import express from "express";
import connectDb from "./config/db.js";
import router from "./routes/agent.route.js";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.use("/", router);

app.get("/", (req, res) => {
  res.json({ message: "AGENT service is running" });
});

app.listen(PORT, () => {
  console.log(`AGENT service is running on port ${PORT}`);
  connectDb();
});
