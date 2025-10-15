"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode; 
  text: string;          
  className?: string;    
}

export default function EmptyState({ icon, text, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-muted-foreground",
        className
      )}
    >
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="mb-3 text-primary"
      >
        {icon}
      </motion.div>
      <p className="text-sm md:text-base font-medium">{text}</p>
    </div>
  );
}
