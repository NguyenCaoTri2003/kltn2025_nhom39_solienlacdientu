import { useEffect } from "react";

interface LightboxProps {
  src: string | null; 
  onClose: () => void;
}

export default function Lightbox({ src, onClose }: LightboxProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
      onClick={onClose}
    >
      <img
        src={src}
        className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg cursor-zoom-in"
        onClick={(e) => e.stopPropagation()} 
      />
      <button
        className="absolute top-5 right-5 text-white text-3xl font-bold"
        onClick={onClose}
      >
        &times;
      </button>
    </div>
  );
}
