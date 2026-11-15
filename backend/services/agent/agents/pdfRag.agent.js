import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  computeDocHash,
  getOrInitVectorStore,
  hybridRerank,
} from "../config/vectorDb.js";
import { getModel } from "../config/llmModels.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const pdfRag = async (state) => {
  await checkAgentLimit(state.userId, "pdf");
  try {
    if (!state.file || !state.file.path) {
      return {
        ...state,
        aiResponse: "Please provide a valid PDF document to query.",
      };
    }

    const buffer = fs.readFileSync(state.file.path);
    const docHash = computeDocHash(buffer);
    const collectionName = `pdf_${docHash}`;

    let store;
    let isCacheHit = false;

    // 1. Check if document is already indexed in Vector Store (0ms Deduplication)
    try {
      const cacheCheck = await getOrInitVectorStore([], collectionName);
      if (cacheCheck?.cached && cacheCheck?.store) {
        store = cacheCheck.store;
        isCacheHit = true;
      }
    } catch {
      // Not cached, will proceed to parse and index
    }

    // 2. Parse & Index only on cache miss
    if (!store) {
      const pdf = new PDFParse({ data: buffer });
      const result = await pdf.getText();
      const text = result?.text || "";

      if (!text.trim()) {
        return {
          ...state,
          aiResponse: "The uploaded PDF appears to be empty or contains scanned images without selectable text.",
        };
      }

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const docs = await splitter.createDocuments(
        [text],
        [{ source: state.file.originalname || "document.pdf", docHash }]
      );

      const initResult = await getOrInitVectorStore(docs, collectionName);
      store = initResult.store;
    }

    // 3. Stage 1: Broad Semantic Candidate Retrieval (Top 10)
    const candidateDocs = await store.similaritySearch(state.prompt, 10);

    // 4. Stage 2: Reciprocal Rank Fusion (RRF) Hybrid Re-ranking (Top 4)
    const topRankedDocs = hybridRerank(candidateDocs, state.prompt, 4);
    const context = topRankedDocs.map((d) => d.pageContent).join("\n\n---\n\n");

    // 5. LLM Synthesis with Grounded Guardrails
    const llm = await getModel("chat");

    const messages = [
      new SystemMessage(`You are Kaido PDF Intelligence Assistant.

Operational Guardrails:
- Answer ONLY using the facts present in the provided Document Context.
- Never hallucinate, extrapolate, or make up facts outside the context.
- If the answer cannot be determined with confidence from the context, explicitly reply:
  "I couldn't find this information in the uploaded PDF."
- Present facts, numbers, dates, and names with high precision.
- Use clear Markdown formatting with bullet points where appropriate.
${isCacheHit ? "[Optimized: Instant Document Fingerprint Cache Hit]" : ""}`),
      new HumanMessage(`Document Context:
${context}

User Question:
${state.prompt}`),
    ];

    const response = await llm.invoke(messages);
    await deductCredits(state.userId, "pdf");

    return {
      ...state,
      aiResponse: response.content,
    };
  } catch (error) {
    console.error("[pdfRag Error]:", error);
    return {
      ...state,
      aiResponse: "Failed to analyze PDF due to an internal processing error. Please try again.",
    };
  } finally {
    try {
      if (state.file?.path && fs.existsSync(state.file.path)) {
        fs.unlinkSync(state.file.path);
      }
    } catch (err) {
      console.warn("[pdfRag Cleanup Warning]:", err.message);
    }
  }
};
