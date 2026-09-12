import { getModel } from "../config/llmModels.js";
import { generatePdf } from "../utils/generatePdf.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { uploadToS3 } from "../utils/uploadToS3.js";

export const pdfAgent = async (state) => {
  try {
    const llm = await getModel("pdf");
    const prompt = `
You are an expert report-writing assistant.

Based on the user's request, generate structured content for a PDF report.

Return ONLY valid JSON matching this exact schema — nothing else:

{
  "title": "Report title",
  "subtitle": "Short subtitle",
  "sections": [
    {
      "heading": "Section heading",
      "points": ["point 1", "point 2", "point 3"]
    }
  ]
}

Rules:
- Output must start with { and end with }.
- No markdown, no \`\`\` fences, no explanation text.
- Escape all special characters so the JSON is parseable.

User Request:
${state.prompt}
`;
    const res = await llm.invoke(prompt);
    let data;
    try {
      const cleaned = res.content.trim().replace(/^```json\n?|\n?```$/g, "");
      data = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse PDF agent JSON:", e, res.content);
      return {
        ...state,
        aiResponse:
          "Sorry, something went wrong while generating the PDF content. Please try again.",
      };
    }
    const pdfBuffer = await generatePdf(data);
    const filename = `pdf-${Date.now()}.pdf`;
    await uploadToS3(filename, pdfBuffer, "application/pdf");
    const downloadUrl = await getFromS3(filename, 60 * 60 * 24);
    return {
      ...state,
      aiResponse: `# PDF Generated
**${data.title}**
[Download PDF](${downloadUrl})
_Link Expire in 24 Hours_`,
    };
  } catch (error) {
    console.error(error);
    return {
      ...state,
      aiResponse: "Failed To Generate PDF",
    };
  }
};
