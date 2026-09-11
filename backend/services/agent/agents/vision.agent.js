import { randomUUID } from "crypto";
import axios from "axios";
import { getModel } from "../config/llmModels.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";

export const visionAgent = async (state) => {
  try {
    const prompt = state.prompt?.trim();

    if (!prompt) {
      return {
        ...state,
        aiResponse: "Please provide a prompt for image generation.",
      };
    }

    const llm = await getModel("image");

    const res = await llm.invoke(`
      You are an elite AI image prompt engineer.

      Convert the user request into a highly detailed image generation prompt.

      Requirements:
      - Cinematic lighting
      - Professional composition
      - Ultra realistic
      - High detail
      - Beautiful color palette
      - Sharp focus
      - 8K quality
      - Photorealistic
      - Depth of field
      - Professional photography
      - Stunning visuals

      Return only the image prompt.

      User Request:
      ${prompt}
    `);

    const enhancedPrompt = res.content.trim();

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt,
    )}`;

    const imageRes = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const buffer = Buffer.from(imageRes.data);

    const filename = `generated-images/${randomUUID()}.png`;

    await uploadToS3(filename, buffer, "image/png");

    const expirySeconds = 24 * 60 * 60;

    const downloadUrl = await getFromS3(filename, expirySeconds);

    return {
      ...state,
      aiResponse: "Image generated successfully!",
      images: [downloadUrl],
    };
  } catch (error) {
    console.error("Image generation failed:", error);

    return {
      ...state,
      aiResponse:
        "Sorry, I couldn't generate the image right now. Please try again.",
    };
  }
};
