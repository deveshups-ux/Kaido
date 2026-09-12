import { getModel } from "../config/llmModels.js";
import { generatePpt } from "../utils/generatePpt.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";

export const pptAgent = async (state) => {
  try {
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
    const data = JSON.parse(res.content);
    const ppt = await generatePpt(data);
    const buffer = await ppt.write({
      outputType: "nodebuffer",
    });
    const filename = `pdf-${Date.now()}.pdf`;
    await uploadToS3(
      filename,
      buffer,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    const downloadUrl = await getFromS3(filename, 20 * 60 * 60);
    return {
      ...state,
      aiResponse: `# Presentaion Generated
**${data.title}**

[Download PPT](${downloadUrl})

_Link expires in 1 day._`,
    };
  } catch (error) {
    console.log(error);
    return {
      ...state,
      aiResponse: "Failed To Generate PPT",
    };
  }
};
