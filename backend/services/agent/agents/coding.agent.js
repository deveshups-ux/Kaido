import { checkAgentLimit } from "../config/agentLimit.js";
import { getModel } from "../config/llmModels.js";
import { deductCredits } from "../utils/deductCredits.js";

export const codingAgent = async (state) => {
  // Only check agent limit on initial invocation (not during self-correction loops)
  if (!state.iterationCount || state.iterationCount === 0) {
    await checkAgentLimit(state.userId, "coding");
  }

  try {
    const llm = await getModel("coding");
    const intentLlm = await getModel("intent");

    // If already in a retry loop, skip re-classifying intent
    let intent = "CODE_GENERATION";
    if (!state.iterationCount || state.iterationCount === 0) {
      const intentRes = await intentLlm.invoke(`
You are an intent classifier for a coding assistant.

Classify the user's request into EXACTLY ONE of these categories:

CODE_GENERATION — user wants a new project, app, website, or feature built from scratch.
CODE_REVIEW — user wants existing code reviewed for quality, bugs, or best practices.
CODE_EXPLANATION — user wants existing code explained or clarified.
DEBUGGING — user has an error, bug, or something not working and wants it fixed.
OPTIMIZATION — user wants existing code made faster, cleaner, or more efficient.
CONVERSION — user wants code converted from one language/framework to another.
DOCUMENTATION — user wants comments, docstrings, or README-style documentation written.

Rules:
- Respond with ONLY the category name, nothing else.
- No explanation, no punctuation, no extra words.
- If the request is ambiguous, pick the closest match.

User Request:
${state.prompt}
`);
      intent = intentRes.content.trim().toUpperCase();
    }

    if (intent === "CODE_GENERATION") {
      const feedbackDirective = state.codeErrors
        ? `\n\n[CRITICAL EVALUATOR FEEDBACK — ATTEMPT #${(state.iterationCount || 0) + 1}]
The previous generation failed validation with the following issues:
- ${state.codeErrors}
You MUST fix all of these issues while generating the complete project. Ensure all brackets are balanced, files are complete, and the JSON is 100% syntactically valid.`
        : "";

      const prompt = `
You are Kaido, an expert AI coding agent that builds complete, working web projects.

TASK: Generate a complete project based on the user's request below.

STACK RULES:
- Default to plain HTML, CSS, and JavaScript.
- Only use React, Next.js, or Vue if the user explicitly asks for it by name.
- If a framework is requested, still return the same JSON file structure (adjust file names/extensions accordingly, e.g. App.jsx, index.js).

- For any images, use Picsum Photos placeholder URLs in this format:
  https://picsum.photos/{width}/{height}
  (e.g. https://picsum.photos/800/600 for a food card image).
  Add a unique seed/random number per image if multiple images are needed, e.g.:
  https://picsum.photos/800/600?random=1
  https://picsum.photos/800/600?random=2
  Never use broken/fake/placeholder image paths like "image.jpg" or Unsplash source URLs.

CODE QUALITY RULES:
- Code must be complete and runnable as-is — no placeholders like "// add logic here".
- No broken links, missing imports, or undefined variables.
- Keep file sizes reasonable; avoid unnecessary complexity.

OUTPUT FORMAT (STRICT):
Return ONLY valid JSON matching this exact schema — nothing else:

{
  "title": "Short 3-6 word project title",
  "files": [
    { "name": "index.html", "content": "..." },
    { "name": "style.css", "content": "..." },
    { "name": "script.js", "content": "..." }
  ]
}

OUTPUT RULES:
- Output must start with { and end with }.
- No markdown formatting.
- No \`\`\` code fences.
- No explanation text before or after the JSON.
- Escape all special characters properly so the JSON is parseable.
- Never mention your classification or reasoning process.
${feedbackDirective}

User Request:
${state.prompt}
`;

      const res = await llm.invoke(prompt);
      let data;
      try {
        const cleaned = res.content.trim().replace(/^```json\n?|\n?```$/g, "");
        data = JSON.parse(cleaned);
      } catch (e) {
        console.warn("[codingAgent] Failed to parse generated JSON:", e.message);
        return {
          ...state,
          rawGeneratedCode: res.content,
          codeErrors: `Failed to parse generated JSON: ${e.message}`,
          artifacts: [],
        };
      }

      // Deduct credits only on first successful compilation
      if (!state.iterationCount || state.iterationCount === 0) {
        try {
          await deductCredits(state.userId, "coding");
        } catch (credErr) {
          console.warn("Credit deduction warning:", credErr.message);
        }
      }

      return {
        ...state,
        rawGeneratedCode: null,
        aiResponse: "Code Generated Successfully",
        artifacts: [
          {
            id: Date.now(),
            type: "Project",
            files: data.files || [],
            title: data.title || state.prompt?.slice(0, 60) || "Generated Project",
          },
        ],
      };
    }

    // Non-generation requests (code review, explanation, debugging, etc.)
    const res = await llm.invoke(`
You are Kaido, an expert coding assistant.

The user's request has been classified as: ${intent}

Respond in Markdown only, using this structure:

# Overview
## Explanation
## Problems
## Improvements
## Best Practices
## Optimized Code (if needed)

Rules:
- Never generate full project files (no complete HTML/CSS/JS file sets).
- Keep code snippets short and only where relevant to illustrate a point.
- Be concise but thorough.

User Request:
${state.prompt}
`);

    if (!state.iterationCount || state.iterationCount === 0) {
      try {
        await deductCredits(state.userId, "coding");
      } catch (credErr) {
        console.warn("Credit deduction warning:", credErr.message);
      }
    }

    return {
      ...state,
      aiResponse: res.content,
      artifacts: [],
    };
  } catch (error) {
    console.error("[codingAgent Error]:", error);
    return {
      ...state,
      aiResponse: "Failed to generate code response.",
    };
  }
};
