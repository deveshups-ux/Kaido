import dotenv from "dotenv";
dotenv.config();
import express from "express";
import proxy from "express-http-proxy";
const PORT = process.env.PORT || 3000;
const app = express();
app.use("/auth", proxy(process.env.AUTH_SERVICE));
app.get("/", (req, res) => {
  res.json({ message: "Gateway is running" });
});

app.listen(PORT, () => {
  console.log(`Gateway is running on port ${PORT}`);
});
