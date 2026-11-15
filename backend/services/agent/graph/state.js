import { Annotation } from "@langchain/langgraph";

export const agentState = Annotation.Root({
  prompt: Annotation(),
  aiResponse: Annotation(),
  agent: Annotation(),
  conversationId: Annotation(),
  searchResults: Annotation(),
  images: Annotation(),
  artifacts: Annotation(),
  userId: Annotation(),
  file: Annotation(),
  // Cyclic Self-Correction Evaluator-Optimizer state fields
  codeErrors: Annotation(),
  iterationCount: Annotation(),
  isValid: Annotation(),
  rawGeneratedCode: Annotation(),
});
