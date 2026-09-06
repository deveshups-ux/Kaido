import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ExternalLink, X } from "lucide-react";

const CodeBlock = ({ className, children }) => {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0a0c11]">
      <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.03] border-b border-white/[0.06]">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors duration-150 bg-transparent border-none cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={12} />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed [scrollbar-width:thin]">
        <code className={className}>{code}</code>
      </pre>
    </div>
  );
};

const MessageBubble = ({ role, content, images = [] }) => {
  const isUser = role === "user";
  const [lightBox, setLightBox] = useState(null);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`w-fit max-w-[92vw] md:max-w-[72%] px-4 py-2.5 rounded-2xl overflow-hidden break-words leading-relaxed 
                ${
                  isUser
                    ? "bg-linear-to-br from-indigo-500 to-violet-700 text-white rounded-tr-sm"
                    : "text-slate-200 rounded-tl-sm"
                }`}
      >
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="Search result"
                loading="lazy"
                onError={(e) => e.currentTarget.remove()}
                onClick={() => setLightBox(img)}
                className="w-40 h-28 rounded-xl object-cover border border-white/10 cursor-zoom-in hover:opacity-90 transition"
              />
            ))}
          </div>
        )}

        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mt-5 mb-3">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold mt-3 mb-1">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-3 whitespace-pre-wrap break-words">{children}</p>
            ),
            code({ inline, className, children, ...props }) {
              if (inline) {
                return (
                  <code
                    className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-indigo-300 text-[12.5px] font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return <CodeBlock className={className}>{children}</CodeBlock>;
            },
            pre({ children }) {
              return <>{children}</>;
            },
            a({ children, href }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-300 items-center gap-1 hover:text-indigo-200 underline "
                >
                  <ExternalLink size={14} />
                  {children}
                </a>
              );
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto my-3 rounded-lg border border-white/[0.08]">
                  <table className="w-full text-[13px] border-collapse">
                    {children}
                  </table>
                </div>
              );
            },
            th({ children }) {
              return (
                <th className="px-3 py-2 bg-white/[0.05] text-left font-semibold text-slate-200 border-b border-white/[0.08]">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="px-3 py-2 border-b border-white/[0.05]">
                  {children}
                </td>
              );
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-2 border-indigo-400/50 pl-3 my-2 italic opacity-90">
                  {children}
                </blockquote>
              );
            },
            ul({ children }) {
              return (
                <ul className="list-disc pl-5 my-2 space-y-1 marker:text-slate-400">
                  {children}
                </ul>
              );
            },
            ol({ children }) {
              return (
                <ol className="list-decimal pl-5 my-2 space-y-1 marker:text-slate-400">
                  {children}
                </ol>
              );
            },
            li({ children }) {
              return <li>{children}</li>;
            },
            strong({ children }) {
              return <strong className="font-semibold">{children}</strong>;
            },
            hr() {
              return <hr className="my-3 border-white/[0.08]" />;
            },
          }}
        >
          {content || ""}
        </Markdown>
      </div>

      {lightBox && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex p-6 items-center justify-center">
          <button
            onClick={() => setLightBox(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 rounded-full p-2"
          >
            <X size={20} />
          </button>
          <img
            src={lightBox}
            alt="Lightbox"
            className="max-w-[90vw] max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
