"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

// Reusable confirmation dialog using Sonner toast
// Returns a Promise<boolean> that resolves to true when confirmed, false when cancelled
export const confirmWithToast = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div
          className="flex flex-col gap-3 bg-popover text-popover-foreground border border-border rounded-lg p-4 shadow-xl min-w-[340px]"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100/10 text-yellow-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-base">Xác nhận hành động</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted"
              onClick={() => {
                toast.dismiss(t);
                resolve(false);
              }}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                toast.dismiss(t);
                resolve(true);
              }}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  });
};
