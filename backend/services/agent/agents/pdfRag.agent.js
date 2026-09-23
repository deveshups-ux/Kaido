import fs from "fs";
import PDFParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDb.js";
import { getModel } from "../config/llmModels.js";
import { deductCredits } from "../utils/deductCredits.js";

export const pdfRag = async (state) => {
  try {
    const buffer = fs.readFileSync(state.file.path);
    const pdf = new PDFParse({
      data: buffer,
    });
    const result = pdf.getText();
    const text = result.text;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await splitter.createDocuments([text]);
    const collectionName = `pdf-${Date.now()}`;
    const store = vectorStore(docs, collectionName);
    const relevantDocs = await store.similaritySearch(state.prompt, 5);
    const context = relevantDocs.map((d) => d.pageContent).join("/n/n");
    const llm = await getModel("pfdRag");

    const messages = [
      new SystemMessage(`You are CortexAI PDF Assistant.

Rules:

- Answer ONLY from the uploaded PDF.

- Never make up information.

- If the answer is not present in the PDF, reply:

"I couldn't find this information in the uploaded PDF."

- Use Markdown formatting.
`),
      new HumanMessage(`
            Context:${context}
            Question:${state.prompt}
            `),
    ];

    const response = llm.invoke(messages);
    await deductCredits(state.userId, "pdf");
    return {
      ...state,
      aiResponse: response.content,
    };
  } catch (error) {
    console.log(error);
    return {
      ...state,
      aiResponse: "Failed to analyze PDF",
    };
  } finally {
    fs.unlinkSync(state.file.path);
  }
};
