"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  text?: string; // 👈 cho phép truyền text tuỳ ý
  size?: "sm" | "md" | "lg"; // 👈 kích cỡ
}

export default function Loading({
  text = "Đang tải...",
  size = "md",
}: LoadingIndicatorProps) {
  const sizes = {
    sm: "w-4 h-4 text-gray-500",
    md: "w-6 h-6 text-indigo-600",
    lg: "w-8 h-8 text-indigo-700",
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Icon xoay mượt */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 className={`${sizes[size]}`} />
      </motion.div>

      {/* Text có animation nhịp nhịp */}
      <motion.span
        className="text-gray-700 font-medium text-sm md:text-base"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.span>
    </div>
  );
}
