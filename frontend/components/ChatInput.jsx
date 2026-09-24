import React, { useState } from "react";
import {
  Paperclip,
  Mic,
  Send,
  Zap,
  MessageSquare,
  Code2,
  FileText,
  Presentation,
  ImageIcon,
  Globe,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import sendMessage from "../features/sendMessage.js";
import {
  addMessage,
  setArtifacts,
  setIsLoading,
  setMessages,
} from "../src/redux/messageSlice";
import { createConversation } from "../features/createConversation.js";
import {
  addConversation,
  setConvTitle,
  setSelectedConversation,
} from "../src/redux/conversationSlice.js";
import { updateConversation } from "../features/updateConversation.js";
import { useRef } from "react";

const ChatInput = () => {
  const [value, setValue] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("auto");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef(null);
  const { selectedConversation } = useSelector((state) => state.conversation);

  const dispatch = useDispatch();

  const handleSendMessage = async () => {
    dispatch(setIsLoading(true));
    let conversation = selectedConversation;
    if (!conversation) {
      const conv = await createConversation();
      if (!conv) {
        dispatch(
          addMessage({
            role: "assistant",
            content:
              "Sorry, couldn't start a new conversation. Please try again.",
          }),
        );
        return;
      }
      dispatch(setSelectedConversation(conv));
      dispatch(addConversation(conv));
      conversation = conv;
    }
    if (conversation.title === "New conversation") {
      const conv = await updateConversation({
        id: conversation._id,
        title: value.trim(),
      });

      dispatch(
        setConvTitle({
          conversationId: conversation._id,
          title: value.trim().slice(0, 40),
        }),
      );
    }

    const formData = new FormData();
    formData.append("prompt", value.trim());
    formData.append("conversationId", conversation?._id);
    formData.append("agent", selectedAgent.toLowerCase());
    formData.append("file", selectedFile);

    dispatch(addMessage({ role: "user", content: value.trim() }));
    setValue("");

    const data = await sendMessage(formData);
    dispatch(setIsLoading(false));
    setSelectedFile(null);
    if (data && !data.error) {
      dispatch(setArtifacts(data.artifacts || []));
      dispatch(
        addMessage({
          role: "assistant",
          content: data.answer,
          images: data.images,
        }),
      );
    } else {
      dispatch(
        addMessage({
          role: "assistant",
          content:
            data?.message || "Sorry, something went wrong. Please try again.",
        }),
      );
    }
  };

  const agents = [
    {
      id: "auto",
      icon: Zap,
      label: "Auto",
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat",
    },
    {
      id: "coding",
      icon: Code2,
      label: "Coding",
    },
    {
      id: "pdf",
      icon: FileText,
      label: "PDF",
    },
    {
      id: "ppt",
      icon: Presentation,
      label: "PPT",
    },
    {
      id: "vision",
      icon: ImageIcon,
      label: "Vision",
    },
    {
      id: "search",
      icon: Globe,
      label: "Search",
    },
  ];

  return (
    <div className="w-full overflow-hidden px-3 md:px-5 py-4 border-t border-white/[0.06] bg-[#0d0f14]">
      <div className="flex flex-col bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 pt-3.5 pb-2.5">
        <div className="flex w-[80%] flex-wrap gap-2 pr-2">
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.id;
            const Icon = agent.icon;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`flex-shrink-0 inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all  ${isActive ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-transparent" : "bg-white/[0.05] text-slate-400 border-white/[0.06] hover:bg-white/[0.07]"}`}
              >
                <Icon
                  size={14}
                  className={isActive ? "text-white" : "text-slate-500"}
                />
                <span>{agent.label}</span>
              </div>
            );
          })}
        </div>
        {selectedFile && (
          <div className="my-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              {selectedFile?.type === "application/pdf" && (
                <FileText size={16} className="text-red-400" />
              )}
              {selectedFile?.type.startsWith("image/") && (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  className="h-10 w-10 rounded-xl object-cover mt-3"
                  alt="Preview"
                />
              )}{" "}
              <div>
                <p className="text-xs text-white">{selectedFile?.name}</p>
                <p className="text-[10px] text-slate-500">
                  {Math.ceil(selectedFile.size / 1024)} KB
                </p>
              </div>
              <button
                className="ml-2"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                <X size={14} className="text-slate-500 hover:text-white" />
              </button>
            </div>
          </div>
        )}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask Anything..."
          className="w-full bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
          rows={3}
        />

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <input
              type="file"
              accept=".pdf,image/*"
              hidden
              ref={fileRef}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSelectedFile(file);
                }
              }}
            />

            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer"
              onClick={() => fileRef.current.click()}
            >
              <Paperclip size={16} />
            </button>
            <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer">
              <Mic size={16} />
            </button>
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!value.trim()}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all duration-150 ${value.trim() ? "bg-gradient-to-br from-indigo-500 to-violet-600 hover:opacity-90 text-white" : "bg-white/[0.05] text-slate-600 cursor-not-allowed"}`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
