"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateNotificationModal } from "./CreateNotificationModal";

export function NotificationsManagement() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Quản lý thông báo
        </h1>
        <p className="text-muted-foreground">
          Tạo và quản lý thông báo cho người dùng
        </p>
      </div>

      <div className="flex items-center justify-end mb-4">
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tạo thông báo
        </Button>
      </div>

      <div className="mt-4">
        <p className="text-muted-foreground text-sm">
          Danh sách thông báo sẽ được hiển thị ở đây
        </p>
      </div>

      <CreateNotificationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
        }}
      />
    </div>
  );
}

