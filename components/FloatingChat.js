"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingChat() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Hide floating button on chat, login, and admin pages
    if (pathname === "/chat" || pathname === "/login" || pathname?.startsWith("/admin")) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    async function checkMessages() {
      try {
        const res = await fetch("/api/messages/unread-count", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (err) {
        // Silent fail — don't break the UI
      }
    }

    checkMessages();

    // Check again every 10 seconds for new messages
    const interval = setInterval(checkMessages, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <Link
      href="/chat"
      className={`floating-chat-btn ${unreadCount > 0 ? "pulse" : ""}`}
      title="Ichki messenjer"
      aria-label="Xabarlar"
      id="floating-chat-btn"
    >
      <i className="ti ti-brand-telegram"></i>
      {unreadCount > 0 && <span className="badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </Link>
  );
}
