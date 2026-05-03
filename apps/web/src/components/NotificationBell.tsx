"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { myNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from "@/lib/account";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BellIcon as Bell, CheckCircledIcon as CheckCheck } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { token } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) { 
      setItems([]); 
      setIsLoading(false); 
      return; 
    }
    
    let cancelled = false;
    
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const res = await myNotifications(token);
        if (!cancelled) setItems(res);
        
        // If the popover is being opened and there are unread items, mark them as read
        if (open && res.some(n => !n.is_read)) {
          await markAllNotificationsRead(token);
          if (!cancelled) {
            setItems(currentItems => currentItems.map(n => ({ ...n, is_read: true })));
          }
        }
      } catch (err) {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    
    fetchNotifications();
    
    return () => { cancelled = true; };
  }, [token, open]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  if (!token) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
          <Bell className="size-[1.1rem]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 flex size-2 items-center justify-center rounded-full bg-primary ring-2 ring-background">
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg border-border/50 rounded-xl z-[100]">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h4 className="font-semibold text-sm display">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-xs font-medium text-muted-foreground">{unreadCount} unread</span>
          )}
        </div>
        <div className="flex flex-col max-h-[400px] overflow-y-auto">
          {isLoading && items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <CheckCheck className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            items.map((n) => (
              <div 
                key={n.id} 
                className={cn(
                  "flex flex-col gap-1.5 p-4 border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30 cursor-pointer",
                  !n.is_read ? "bg-primary/5" : ""
                )}
                onClick={async () => {
                  if (n.is_read) return;
                  try {
                    const updated = await markNotificationRead(token, n.id);
                    setItems((xs) => xs.map((x) => (x.id === n.id ? updated : x)));
                  } catch { /* silent */ }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!n.is_read && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                    <p className={cn("text-sm font-medium", !n.is_read ? "text-foreground" : "text-foreground/80")}>
                      {n.title}
                    </p>
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded-sm shrink-0">
                    {n.type}
                  </span>
                </div>
                <p className={cn("text-xs line-clamp-2 mt-0.5", !n.is_read ? "text-foreground/80 ml-3.5" : "text-muted-foreground")}>
                  {n.message}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
