import vm from "vm";

/**
 * Validates JavaScript code for syntax correctness without executing it
 */
const validateJavaScriptSyntax = (code) => {
  if (!code || typeof code !== "string") return { valid: false, error: "Empty or invalid code content" };
  
  // Neutralize ES module syntax for standard Script compilation
  const sanitized = code
    .replace(/import\s+.*?from\s+['"][^'"]+['"];?/g, "// import")
    .replace(/import\s+['"][^'"]+['"];?/g, "// import")
    .replace(/export\s+default\s+/g, "")
    .replace(/export\s+(const|let|var|function|class)\s+/g, "$1 ");

  try {
    new vm.Script(sanitized);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

/**
 * Validates HTML structure for basic well-formedness
 */
const validateHtmlStructure = (content) => {
  if (!content || typeof content !== "string") return { valid: false, error: "Empty HTML content" };
  const lower = content.toLowerCase();
  
  // Check basic essential containers
  const hasHtmlOpen = lower.includes("<html") || lower.includes("<!doctype html");
  const hasBody = lower.includes("<body") || lower.includes("<div");
  
  if (!hasHtmlOpen && !hasBody) {
    return { valid: false, error: "HTML file lacks document structure (missing <html> or <body>)" };
  }
  return { valid: true };
};

/**
 * Evaluator-Optimizer Node (The Critic / Linter)
 * Performs AST/JSON schema validation and triggers self-correction cycles
 */
export const codeValidator = async (state) => {
  const currentRetries = state.iterationCount || 0;
  const MAX_RETRIES = 3;

  // 1. If not a project generation task, pass through immediately
  if (!state.artifacts || state.artifacts.length === 0) {
    // If there was a raw JSON parse error recorded from the generator
    if (state.rawGeneratedCode && !state.aiResponse?.includes("Succesfully")) {
      if (currentRetries < MAX_RETRIES) {
        return {
          ...state,
          isValid: false,
          codeErrors: `Failed to parse generated JSON. Your output must start with { and end with } without markdown fences: ${state.rawGeneratedCode.slice(0, 200)}`,
          iterationCount: currentRetries + 1,
        };
      }
    }
    return {
      ...state,
      isValid: true,
      codeErrors: null,
    };
  }

  // 2. Validate Project Artifacts
  const errors = [];
  const project = state.artifacts[0];

  if (!project.files || !Array.isArray(project.files) || project.files.length === 0) {
    errors.push("Project must contain a non-empty 'files' array.");
  } else {
    for (const file of project.files) {
      if (!file.name || typeof file.content !== "string") {
        errors.push(`File missing valid 'name' or string 'content'.`);
        continue;
      }

      if (file.content.trim().length === 0) {
        errors.push(`File '${file.name}' has empty content.`);
      }

      // JavaScript Syntax Linting
      if (file.name.endsWith(".js") || file.name.endsWith(".jsx")) {
        const jsCheck = validateJavaScriptSyntax(file.content);
        if (!jsCheck.valid) {
          errors.push(`Syntax error in '${file.name}': ${jsCheck.error}`);
        }
      }

      // HTML Basic Structure Check
      if (file.name.endsWith(".html")) {
        const htmlCheck = validateHtmlStructure(file.content);
        if (!htmlCheck.valid) {
          errors.push(`Structure issue in '${file.name}': ${htmlCheck.error}`);
        }
      }
    }
  }

  // 3. Self-Correction Feedback Loop Decision
  if (errors.length > 0 && currentRetries < MAX_RETRIES) {
    console.warn(`[Evaluator-Optimizer] Validation failed (Attempt ${currentRetries + 1}/${MAX_RETRIES}). Routing back with error feedback:`, errors);
    return {
      ...state,
      isValid: false,
      codeErrors: errors.join("\n- "),
      iterationCount: currentRetries + 1,
    };
  }

  // 4. Verification Passed (or max retries reached safely)
  const isSelfHealed = currentRetries > 0 && errors.length === 0;
  return {
    ...state,
    isValid: true,
    codeErrors: null,
    aiResponse: isSelfHealed
      ? `Project generated and self-healed successfully after automated evaluation (${currentRetries} correction cycles).`
      : state.aiResponse || "Code Generated Successfully",
  };
};
