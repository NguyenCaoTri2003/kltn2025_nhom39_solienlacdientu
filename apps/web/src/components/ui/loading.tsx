"use client";

import { motion } from "framer-motion";

interface LoadingDotsProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  dotCount?: number;
}

export default function Loading({
  text = "Đang tải dữ liệu...",
  size = "md",
  color = "#005FF9",
  dotCount = 8,
}: LoadingDotsProps) {
  const sizes = {
    sm: 6,
    md: 10,
    lg: 14,
  };

  const radius = sizes[size] * 2.5; 

  const dots = Array.from({ length: dotCount });

  return (
    <div className="flex flex-col items-center justify-center gap-1 select-none">
      <div className="relative w-32 h-32">
        {dots.map((_, i) => {
          const angle = (360 / dotCount) * i;
          const rad = (angle * Math.PI) / 180;

          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: sizes[size],
                height: sizes[size],
                background: `radial-gradient(circle, ${color} 0%, ${color}99 80%)`,
                top: `calc(50% + ${radius * Math.sin(rad)}px - ${sizes[size] / 2}px)`,
                left: `calc(50% + ${radius * Math.cos(rad)}px - ${sizes[size] / 2}px)`,
              }}
              animate={{
                rotate: [0, 360],
                scale: [0.6, 1, 0.6],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.6,
                delay: (i * 0.1),
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>

      <motion.span
        className="text-blue-600 dark:text-blue-300 font-semibold text-base md:text-lg tracking-wide"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        {text}
      </motion.span>
    </div>
  );
}
