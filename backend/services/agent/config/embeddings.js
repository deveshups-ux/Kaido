import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";
dotenv.config();

let instance = null;

export const getEmbeddings = () => {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!instance && key) {
    try {
      instance = new GoogleGenerativeAIEmbeddings({
        apiKey: key,
        model: "gemini-embedding-001",
      });
    } catch (e) {
      console.warn("Failed to initialize GoogleGenerativeAIEmbeddings:", e.message);
    }
  }
  return instance;
};

export const embeddings = new Proxy(function () {}, {
  get(target, prop) {
    const inst = getEmbeddings();
    if (!inst) {
      throw new Error("Google GenerativeAI Embeddings requires GOOGLE_API_KEY environment variable.");
    }
    const val = inst[prop];
    return typeof val === "function" ? val.bind(inst) : val;
  },
});
