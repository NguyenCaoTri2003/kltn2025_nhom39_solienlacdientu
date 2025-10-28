"use client"
import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { Bell, CheckCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotificationManager } from "@/hooks/useNotificationManager"
import { usePathname } from "next/navigation"
import { supabase } from "@packages/data/supabaseClient"

type NotificationItem = {
  id: number
  user_id: number | null
  title: string | null
  content: string | null
  type: "university" | "lecturer" | "system" | null
  is_read?: boolean
  created_at?: string
}

function formatTime(ts?: string) {
  if (!ts) return ""
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} giờ trước`
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
}

interface NotificationDropdownProps {
  userRole?: "admin" | "lecturer" | "student" | "parent" | null;
}

export default function NotificationDropdown({ userRole }: NotificationDropdownProps = {}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [userId, setUserId] = useState<number | null>(null)
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  
  const { unreadCount, markAllAsRead, deleteAll, notifications, setUnreadCount } = useNotificationManager(userId)
  const pathname = usePathname()
  

  const notificationsPath = useMemo(() => {

    if (pathname?.startsWith("/lecturer")) return "/lecturer/notifications"
    if (pathname?.startsWith("/admin")) return "/admin/notifications"
    if (pathname?.startsWith("/portal")) return "/portal/notifications"
    
    if (userRole === "admin") return "/admin/notifications"
    if (userRole === "lecturer") return "/lecturer/notifications"
    return "/portal/notifications"
  }, [userRole, pathname])
  
  const onListPage = useMemo(() => pathname?.startsWith(notificationsPath), [pathname, notificationsPath])
  const displayItems = useMemo(() => {
    return onListPage ? (notifications || []).slice(0, 10) : items
  }, [onListPage, notifications, items])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        const u = JSON.parse(raw)
        if (u?.id) setUserId(Number(u.id))
        return
      }
      const cookieUserRaw = document.cookie.split("; ").find(r => r.startsWith("user="))?.split("=")[1]
      if (cookieUserRaw) {
        const u = JSON.parse(decodeURIComponent(cookieUserRaw))
        if (u?.id) setUserId(Number(u.id))
      }
    } catch {}
  }, [])

  const getToken = useCallback(() => {
    const cookieToken = document.cookie.split("; ").find(r => r.startsWith("token="))?.split("=")[1]
    return cookieToken || localStorage.getItem("token") || ""
  }, [])

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${apiBase}/api/user-notifications?page=1&pageSize=10`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: "no-store",
      })
      if (!res.ok) return
      const data = await res.json()
      const list: NotificationItem[] = data?.data || []
      setItems(list)
    } finally {
      setLoading(false)
    }
  }, [apiBase, getToken])

  useEffect(() => {
    if (!userId) return
    if (onListPage) return 
    fetchList()
  }, [userId, onListPage, fetchList])


  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const res = await fetch(`${apiBase}/api/user-notifications/unread-count`, {
          headers: { Authorization: `Bearer ${getToken()}` },
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        const count = Number(data?.count || 0)
        setUnreadCount(count)
      } catch {}
    })()
  }, [userId, apiBase, getToken, setUnreadCount])


  useEffect(() => {
    if (!userId) return
    if (onListPage) return
    const channel = supabase
      .channel(`dropdown_notifications_user_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload: { new: NotificationItem }) => {
          const n = payload?.new
  
          setItems(prev => [{ ...n, is_read: false }, ...prev].slice(0, 10))
          try { localStorage.setItem('notifications:version', String(Date.now())) } catch {}
        }
      )
      .subscribe()
    return () => { try { supabase.removeChannel(channel) } catch {} }
  }, [userId, onListPage])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'notifications:version') fetchList()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [fetchList])


  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current) return
      if (open && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])



  

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${apiBase}/api/user-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ action: "markAllAsRead" }),
      })
      markAllAsRead()
      try { localStorage.setItem('notifications:version', String(Date.now())) } catch {}
    } catch {}
  }

  const handleDeleteAll = async () => {
    try {
      await fetch(`${apiBase}/api/user-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ action: "deleteAll" }),
      })
      deleteAll()
      try { localStorage.setItem('notifications:version', String(Date.now())) } catch {}
    } catch {}
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(o => !o)} className="relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-card border border-border rounded-md shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="text-sm font-semibold">Thông báo</div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="gap-1 text-green-400">
                <CheckCheck className="w-4 h-4" /> Đã đọc
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDeleteAll} className="gap-1 text-destructive">
                <Trash2 className="w-4 h-4" /> Xóa hết
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Đang tải...</div>
            ) : displayItems.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Chưa có thông báo</div>
            ) : (
              displayItems.map(item => (
                <a
                  key={item.id}
                  href={`${notificationsPath}/${item.id}`}
                  className={`block px-3 py-2 border-b border-border hover:bg-accent ${!item.is_read ? "bg-accent/40" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase text-primary font-medium">{item.type || "system"}</div>
                    <div className="text-xs text-muted-foreground">{formatTime(item.created_at)}</div>
                  </div>
                  <div className="text-sm text-foreground truncate">
                    {item.title || item.content || "Không có nội dung"}
                  </div>
                </a>
              ))
            )}
          </div>
          <div className="p-2 text-right">
            <a href={notificationsPath} className="text-xs text-primary hover:underline">
              Xem tất cả
            </a>
          </div>
        </div>
      )}
    </div>
  )
}


