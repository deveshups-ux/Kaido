import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Code2,
  Copy,
  Eye,
  PanelLeftCloseIcon,
  PanelRightClose,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";
import { AnimatePresence, easeInOut, motion } from "motion/react";

const escapeScriptTag = (str = "") =>
  String(str).replace(/<\/script>/gi, "<\\/script>");

const escapeStyleTag = (str = "") =>
  String(str).replace(/<\/style>/gi, "<\\/style>");

const Artifact = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState("code");
  const [activeFile, setActiveFile] = useState(0);

  const artifacts = useSelector((state) => state.message.artifacts || []);

  const files = Array.isArray(artifacts?.[0]?.files) ? artifacts[0].files : [];

  const file = files[activeFile] || files[0] || null;

  const htmlFile = files.find((f) => f?.name === "index.html");
  const cssFile = files.find((f) => f?.name === "style.css");
  const jsFile = files.find((f) => f?.name === "script.js");

  const canPreview = Boolean(htmlFile);

  useEffect(() => {
    setActiveFile(0);
    setTab("code");
    setMobileOpen(false);
  }, [artifacts]);

  useEffect(() => {
    if (activeFile >= files.length && files.length > 0) {
      setActiveFile(0);
    }
  }, [files.length, activeFile]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const detectLanguage = (fileName = "") => {
    const name = String(fileName).toLowerCase();

    if (name.endsWith(".html")) return "html";
    if (name.endsWith(".css")) return "css";
    if (name.endsWith(".js")) return "javascript";
    if (name.endsWith(".jsx")) return "javascript";
    if (name.endsWith(".ts")) return "typescript";
    if (name.endsWith(".tsx")) return "typescript";
    if (name.endsWith(".json")) return "json";
    if (name.endsWith(".py")) return "python";
    if (name.endsWith(".java")) return "java";
    if (name.endsWith(".cpp")) return "cpp";
    if (name.endsWith(".c")) return "c";

    return "plaintext";
  };

  const previewDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
${escapeStyleTag(cssFile?.content || "")}
  </style>
</head>
<body>
${htmlFile?.content || ""}
  <script>
${escapeScriptTag(jsFile?.content || "")}
  </script>
</body>
</html>`;

  const handleCopy = async () => {
    try {
      const allCode = files
        .map(
          (f, index) =>
            `/* ${f?.name || `file-${index + 1}`} */\n${f?.content || ""}`,
        )
        .join("\n\n");

      await navigator.clipboard.writeText(allCode);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  if (artifacts.length === 0 || files.length === 0) {
    return null;
  }

  const ArtifactContent = ({ mobile = false }) => {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-col bg-[#0d0f14]">
        <div className="flex min-h-14 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 sm:px-4">
          {!mobile && (
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-slate-500 transition-colors duration-150 hover:bg-white/[0.05] hover:text-slate-200"
            >
              <PanelRightClose size={16} />
            </button>
          )}

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-indigo-500/20 bg-indigo-500/10">
              <Code2 className="text-indigo-400" size={12} />
            </div>

            <div className="truncate text-[13px] font-medium text-slate-200">
              {artifacts[0]?.title || "Generated Project"}
            </div>
          </div>

          <button
            onClick={handleCopy}
            title="Copy all code"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-slate-400 transition-colors duration-150 hover:bg-white/[0.05] hover:text-slate-200"
          >
            <Copy size={15} />
          </button>

          {mobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-slate-400 transition-colors duration-150 hover:bg-white/[0.05] hover:text-slate-200"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {canPreview && (
          <div className="flex shrink-0 items-center justify-center border-b border-white/[0.06] px-3 py-2">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
              <button
                onClick={() => setTab("code")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-150 ${
                  tab === "code"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <Code2 size={11} />
                Code
              </button>

              <button
                onClick={() => setTab("preview")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-150 ${
                  tab === "preview"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <Eye size={11} />
                Preview
              </button>
            </div>
          </div>
        )}

        {tab === "code" && (
          <div className="flex shrink-0 overflow-x-auto border-b border-white/[0.06] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {files.map((f, index) => {
              const fileName = f?.name || `File ${index + 1}`;

              return (
                <button
                  key={`${index}-${fileName}`}
                  onClick={() => setActiveFile(index)}
                  className={`relative shrink-0 whitespace-nowrap border-r border-white/[0.05] bg-transparent px-3 py-2.5 text-[11px] font-medium transition-colors duration-150 sm:px-4 ${
                    activeFile === index
                      ? "text-indigo-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {fileName}

                  {activeFile === index && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-indigo-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {tab === "preview" && canPreview ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              <iframe
                sandbox="allow-scripts allow-modals"
                title="preview"
                srcDoc={previewDoc}
                className="h-full w-full border-none bg-white"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              <Editor
                theme="vs-dark"
                language={detectLanguage(file?.name || "")}
                value={file?.content || ""}
                options={{
                  readOnly: true,
                  minimap: {
                    enabled: false,
                  },
                  fontSize: 13,
                  wordWrap: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: {
                    top: 16,
                  },
                  lineNumbers: "on",
                  renderLineHighlight: "none",
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  folding: true,
                  overviewRulerBorder: false,
                  scrollbar: {
                    horizontalScrollbarSize: 8,
                    verticalScrollbarSize: 8,
                  },
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ width: 400 }}
        animate={{ width: collapsed ? 48 : 400 }}
        transition={{ duration: 0.25, ease: easeInOut }}
        className="hidden h-full shrink-0 flex-col overflow-hidden border-l border-white/[0.06] lg:flex"
      >
        {!collapsed ? (
          <ArtifactContent />
        ) : (
          <div className="flex h-full w-full shrink-0 flex-col items-center gap-3 bg-[#0d0f14] py-4">
            <button
              onClick={() => setCollapsed(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-slate-500 transition-colors duration-150 hover:bg-white/[0.05] hover:text-slate-200"
            >
              <PanelLeftCloseIcon size={16} />
            </button>

            <div className="flex min-w-0 flex-1 items-center">
              <div
                className="whitespace-nowrap text-[10px] font-medium uppercase tracking-widest text-slate-600"
                style={{
                  writingMode: "vertical-lr",
                  transform: "rotate(180deg)",
                }}
              >
                {artifacts[0]?.title || "Generated Project"}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d0f14] px-3.5 text-slate-200 shadow-2xl transition-colors duration-150 hover:bg-[#151821] lg:hidden"
      >
        <Code2 size={16} className="text-indigo-400" />
        <span className="text-xs font-medium">Artifacts</span>
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-black lg:hidden"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: easeInOut }}
              className="fixed right-0 top-0 z-[70] h-[100dvh] w-[min(92vw,520px)] overflow-hidden border-l border-white/[0.06] bg-[#0d0f14] shadow-2xl lg:hidden"
            >
              <ArtifactContent mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Artifact;
