"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUnreadMessageCount } from "@/app/actions";

export default function FloatingChat() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Hide floating button on chat, login, and admin pages
    if (pathname === "/chat" || pathname === "/login" || pathname === "/admin") {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    async function checkMessages() {
      try {
        // Read cookies to check session state
        const cookiesList = document.cookie.split(";").reduce((acc, c) => {
          const [key, val] = c.trim().split("=");
          if (key && val) {
            acc[key] = val;
          }
          return acc;
        }, {});

        const isLoggedIn = cookiesList.is_logged_in === "true";
        const userId = cookiesList.user_id ? parseInt(cookiesList.user_id, 10) : null;

        if (isLoggedIn && userId) {
          const count = await getUnreadMessageCount(userId);
          setUnreadCount(count || 0);
        } else {
          setUnreadCount(0);
        }
      } catch (err) {
        console.error("FloatingChat check error:", err);
      }
    }

    checkMessages();

    // Check again every 30 seconds for new messages
    const interval = setInterval(checkMessages, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <Link 
      href="/chat" 
      className={`floating-chat-btn ${unreadCount > 0 ? "pulse" : ""}`} 
      title="Telegram-messenjer"
      aria-label="Xabarlar"
      style={{ display: "flex" }} // Enforce visibility layout
    >
      <i className="ti ti-brand-telegram"></i>
      {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
    </Link>
  );
}
