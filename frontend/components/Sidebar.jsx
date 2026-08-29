import React, { useEffect, useState } from "react";
import { PanelLeft, PenBoxIcon, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getConversations } from "../features/getConversations";
import {
  addConversation,
  setConversations,
} from "../src/redux/conversationSlice";
import { createConversation } from "../features/createConversation";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [creating, setCreating] = useState(false);
  const dispatch = useDispatch();

  const { conversations } = useSelector((state) => state.conversation);

  useEffect(() => {
    const getCov = async () => {
      const data = await getConversations();
      dispatch(setConversations(data));
    };
    getCov();
  }, []);

  const handleCreateConversation = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const data = await createConversation();
      if (data) {
        dispatch(addConversation(data));
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed lg:static inset-y-0 left-0 z-50 w-[270px] h-screen shrink-0 bg-[#0d0f14] border-r border-white/[0.06]">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]">
          <div
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer"
            onClick={() => setCollapsed(true)}
          >
            <PanelLeft />
          </div>
          <span className="text-[16px] font-semibold text-slate-100 tracking-tight flex-1">
            CortexAI
          </span>

          <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide">
            free
          </span>

          <button
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer disabled:opacity-50"
            onClick={handleCreateConversation}
            disabled={creating}
          >
            <PenBoxIcon size={14} />
          </button>
        </div>

        <div className="px-4 pt-4 pb-1">
          <button
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-gradient-to-br from-indigo-500 to-violet-700 rounded-xl py-[10px] border-none cursor-pointer hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
            onClick={handleCreateConversation}
            disabled={creating}
          >
            <Plus size={15} />
            New Chat
          </button>
        </div>

        {/* Recents label */}
        <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-600">
          Recents
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {conversations && conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv._id}
                className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/[0.05] cursor-pointer truncate transition-colors duration-150"
              >
                {conv.title}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 px-3 py-2">
              No conversations yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;