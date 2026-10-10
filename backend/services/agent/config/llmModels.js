import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

let groqInstance = null;
let openRouterInstance = null;
let geminiInstance = null;

const getGroq = () => {
  if (!groqInstance) {
    groqInstance = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "openai/gpt-oss-120b",
      temperature: 0,
      maxTokens: undefined,
      maxRetries: 2,
    });
  }
  return groqInstance;
};

const getOpenRouter = () => {
  if (!openRouterInstance) {
    openRouterInstance = new ChatOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      model: "deepseek/deepseek-chat",
      temperature: 0,
      maxTokens: 2500,
    });
  }
  return openRouterInstance;
};

const getGemini = () => {
  if (!geminiInstance) {
    geminiInstance = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-3.1-flash-lite",
      temperature: 1,
      maxRetries: 2,
    });
  }
  return geminiInstance;
};

export const getModel = async (agent) => {
  switch (agent) {
    case "chat":
      return getGroq();
    case "search":
      return getGroq();
    case "coding":
      return getOpenRouter();
    case "imageAnalyzer":
      return getGemini();
    default:
      return getGroq();
  }
};
