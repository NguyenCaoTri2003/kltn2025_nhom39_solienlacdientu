"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export default function Loading({
  text = "Đang tải dữ liệu...",
  size = "md",
}: LoadingIndicatorProps) {
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 select-none">
      {/* Loader vòng tròn với màu IUH */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        className="relative"
      >
        <div
          className={`rounded-full p-3 bg-gradient-to-tr from-[#004AAD] via-[#005FF9] to-[#E2001A] shadow-lg`}
        >
          <Loader2 className={`${iconSizes[size]} text-white drop-shadow-lg`} />
        </div>

        {/* Hiệu ứng quầng sáng */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl bg-gradient-to-tr from-[#004AAD]/40 via-[#005FF9]/40 to-[#E2001A]/40"
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Text shimmer với màu IUH */}
      <motion.span
        className="bg-gradient-to-r from-[#004AAD] via-[#005FF9] to-[#E2001A] bg-clip-text text-transparent font-semibold text-base md:text-lg tracking-wide dark:from-[#6BA4FF] dark:via-[#82B6FF] dark:to-[#FF6B7A]"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ backgroundSize: "200% 200%" }}
      >
        {text}
      </motion.span>
    </div>
  );
}
