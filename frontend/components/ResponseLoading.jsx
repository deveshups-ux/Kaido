import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";

const messages = [
  "Searching",
  "Analyzing",
  "Thinking",
  "Processing",
  "Generating",
  "Almost there",
];

const ResponseLoading = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
        <Sparkles size={15} className="text-indigo-400" />
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={messages[index]}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-sm text-slate-400"
          >
            {messages[index]}
          </motion.span>
        </AnimatePresence>

        <div className="flex items-center gap-1">
          {[0, 1, 2].map((item) => (
            <motion.span
              key={item}
              className="h-1.5 w-1.5 rounded-full bg-indigo-400"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: item * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResponseLoading;
