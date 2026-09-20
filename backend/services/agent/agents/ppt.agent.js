import { getModel } from "../config/llmModels.js";
import { generatePpt } from "../utils/generatePpt.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { deductCredits } from "../utils/deductCredits.js";

export const pptAgent = async (state) => {
  try {
    if (!state?.prompt?.trim()) {
      return {
        ...state,
        aiResponse: "Please provide a topic for the presentation.",
      };
    }

    const llm = await getModel("ppt");

    const prompt = `You are a professional presentation designer.
Return ONLY valid JSON.
Format:
{
  "title": "",
  "subtitle": "",
  "slides": [
    {
      "title": "",
      "points": [
        "",
        "",
        "",
        ""
      ]
    }
  ]
}
Rules:
- Generate exactly 6 content slides.
- Each slide should have 4-6 concise bullet points.
- No markdown.
- No explanation.
- No code block.
- Return ONLY JSON.
Topic:
${state.prompt}`;

    const res = await llm.invoke(prompt);

    let raw = res.content.trim();
    raw = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```$/, "")
      .trim();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      console.error("[pptAgent] Failed to parse LLM JSON:", raw);
      throw new Error("LLM returned invalid JSON, please try again");
    }

    if (!Array.isArray(data?.slides) || data.slides.length === 0) {
      throw new Error("LLM response is missing a valid slides array");
    }

    data.slides = data.slides.map((s) => ({
      ...s,
      points: Array.isArray(s.points) ? s.points.slice(0, 6) : [],
    }));
    await deductCredits(state.userId, "ppt");

    const ppt = await generatePpt(data);
    const buffer = await ppt.write({
      outputType: "nodebuffer",
    });

    const filename = `ppt-${Date.now()}.pptx`;

    await uploadToS3(
      filename,
      buffer,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );

    const downloadUrl = await getFromS3(filename, 24 * 60 * 60);

    return {
      ...state,

      aiResponse: `# Presentation Generated
**${data.title}**
[Download PPT](${downloadUrl})
_Link expires in 1 day._`,
    };
  } catch (error) {
    console.error("[pptAgent]", error);
    return {
      ...state,

      aiResponse: `Failed to generate PPT: ${error.message}`,
    };
  }
};
