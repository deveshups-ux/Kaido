import { TavilySearch } from "@langchain/tavily";

let instance = null;

export const getSearchTool = () => {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!instance && apiKey) {
    try {
      instance = new TavilySearch({
        apiKey,
        maxResults: 5,
        topic: "general",
        includeImages: true,
      });
    } catch (err) {
      console.warn("Failed to initialize TavilySearch:", err.message);
    }
  }
  return instance;
};

export const searchTool = {
  invoke: async (input) => {
    const tool = getSearchTool();
    if (!tool) {
      console.warn("Tavily search skipped: TAVILY_API_KEY is not set");
      return { results: [], images: [] };
    }
    return await tool.invoke(input);
  },
};
