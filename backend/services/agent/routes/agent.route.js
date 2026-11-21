import express from "express";
import { agent, agentStream } from "../controllers/agent.controller.js";
import multer from "../config/multer.js";
const router = express.Router();

// Supports both standard JSON and SSE via query param (?stream=true) or Accept header
router.post("/chat", multer.single("file"), agent);

// Dedicated SSE Token Streaming endpoint
router.post("/chat/stream", multer.single("file"), agentStream);

export default router;
