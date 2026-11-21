import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";
import Message from "../../chat/model/message.model.js";

const persistMessage = async (data) => {
  try {
    if (data.conversationId) {
      await Message.create(data);
      return;
    }
  } catch (err) {
    console.warn("Direct Message.create warning:", err.message);
  }

  // Fallback to HTTP if CHAT_SERVICE is set
  const chatUrl = process.env.CHAT_SERVICE || `http://localhost:${process.env.PORT || 8000}/api/chat`;
  try {
    await axios.post(`${chatUrl}/save-message`, data);
  } catch (e) {
    console.warn("HTTP message save fallback warning:", e.message);
  }
};

/**
 * Executes agent workflow with Server-Sent Events (SSE) token-level streaming
 */
const handleStreamingWorkflow = async (req, res, { prompt, conversationId, agent, userId, file }) => {
  // Set SSE Headers with buffer-bypass for proxy layers (Render/NGINX)
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  let clientConnected = true;
  req.on("close", () => {
    clientConnected = false;
  });

  // 1. Save user prompt
  if (conversationId && prompt) {
    await persistMessage({
      conversationId,
      role: "user",
      content: prompt,
    });
  }

  // 2. Announce stream initialization
  res.write(`data: ${JSON.stringify({ type: "start", conversationId })}\n\n`);

  let accumulatedContent = "";
  let finalResult = null;

  try {
    const eventStream = graph.streamEvents(
      {
        prompt,
        conversationId,
        agent,
        userId,
        file,
      },
      { version: "v2" }
    );

    for await (const event of eventStream) {
      if (!clientConnected) break;

      // Real-time LLM token generation stream
      if (event.event === "on_chat_model_stream") {
        const token = event.data?.chunk?.content || "";
        if (token) {
          accumulatedContent += token;
          res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
        }
      }

      // Graph node transitions (Observability for UI, e.g. "routing", "coding", "codeValidator")
      else if (
        event.event === "on_chain_start" &&
        ["router", "coding", "codeValidator", "pdfRag", "ppt", "search"].includes(event.name)
      ) {
        res.write(`data: ${JSON.stringify({ type: "node", node: event.name })}\n\n`);
      }

      // Graph final completion output
      else if (event.event === "on_chain_end" && event.name === "LangGraph") {
        finalResult = event.data?.output;
      }
    }

    const aiResponse = finalResult?.aiResponse || accumulatedContent || "No response generated.";
    const images = finalResult?.images || [];
    const artifacts = finalResult?.artifacts || [];

    // 3. Persist memory & assistant response
    if (conversationId) {
      try {
        await addMessage(conversationId, "user", prompt);
        await addMessage(conversationId, "assistant", aiResponse);
      } catch (memErr) {
        console.warn("Memory update warning:", memErr.message);
      }

      await persistMessage({
        conversationId,
        role: "assistant",
        content: aiResponse,
        images,
        artifacts,
      });
    }

    // 4. Send final completion event
    res.write(
      `data: ${JSON.stringify({
        type: "done",
        answer: aiResponse,
        images,
        artifacts,
      })}\n\n`
    );
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (streamErr) {
    console.error("[SSE Stream Error]:", streamErr);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: "error", message: streamErr.message || "Streaming failed" })}\n\n`);
      res.end();
    }
  }
};

/**
 * Main Agent Controller: Supports both Server-Sent Events (SSE) and buffered JSON
 */
export const agent = async (req, res, next) => {
  try {
    const { prompt, conversationId, agent } = req.body;
    const file = req.file;
    const userId = req.headers["x-user-id"] || req.user?.userId || req.user?._id;

    const isStreaming =
      req.headers.accept?.includes("text/event-stream") ||
      req.query.stream === "true" ||
      req.body?.stream === true ||
      req.body?.stream === "true";

    // Route to SSE Stream if requested
    if (isStreaming) {
      return await handleStreamingWorkflow(req, res, {
        prompt,
        conversationId,
        agent,
        userId,
        file,
      });
    }

    // 1. Save incoming user message (Buffered path)
    if (conversationId && prompt) {
      await persistMessage({
        conversationId,
        role: "user",
        content: prompt,
      });
    }

    // 2. Invoke Multi-Agent LangGraph workflow
    const result = await graph.invoke({
      prompt,
      conversationId,
      agent,
      userId,
      file,
    });

    const aiResponse = result?.aiResponse || "No response generated.";

    // 3. Update memory
    if (conversationId) {
      try {
        await addMessage(conversationId, "user", prompt);
        await addMessage(conversationId, "assistant", aiResponse);
      } catch (memErr) {
        console.warn("Memory update warning:", memErr.message);
      }

      // 4. Save assistant response
      await persistMessage({
        conversationId,
        role: "assistant",
        content: aiResponse,
        images: result?.images || [],
        artifacts: result?.artifacts || [],
      });
    }

    return res.status(200).json({
      answer: aiResponse,
      images: result?.images || [],
      artifacts: result?.artifacts || [],
    });
  } catch (error) {
    console.error("Agent execution error:", error);
    next(error);
  }
};

/**
 * Dedicated SSE endpoint controller (/chat/stream)
 */
export const agentStream = async (req, res, next) => {
  try {
    const { prompt, conversationId, agent } = req.body;
    const file = req.file;
    const userId = req.headers["x-user-id"] || req.user?.userId || req.user?._id;

    return await handleStreamingWorkflow(req, res, {
      prompt,
      conversationId,
      agent,
      userId,
      file,
    });
  } catch (error) {
    console.error("AgentStream execution error:", error);
    next(error);
  }
};
