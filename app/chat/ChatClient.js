"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Nav } from "@/components/ui";
import BackButton from "@/components/BackButton";
import { useTranslation } from "@/lib/useTranslation";
import { sendMessageAction, deleteMessageAction, markMessageReadAction } from "@/app/actions";

function formatTime(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatClient({ user, initialMessages }) {
  const { t, lang } = useTranslation();
  const [messages, setMessages] = useState(initialMessages);
  const [activeChatKey, setActiveChatKey] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // Chat auto-refresh polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            // Compare lengths or contents to avoid redundant updates
            const currentIds = messages.map(m => m.id).join(",");
            const incomingIds = data.messages.map(m => m.id).join(",");
            if (currentIds !== incomingIds) {
              setMessages(data.messages);
            }
          }
        }
      } catch (err) {
        console.error("Chat refresh error:", err);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [messages]);

  // Localization lookups
  const localTexts = {
    uz: {
      back: "Orqaga",
      chat_placeholder: "Xabar yozing...",
      guest_notice: "Mehmon foydalanuvchi. Unga faqat telefon orqali bog'lanish mumkin.",
      select_chat: "Xabarlashishni boshlash uchun suhbatni tanlang",
      call: "Qo'ng'iroq qilish",
      no_messages: "Suhbatlar topilmadi",
      search_chat: "Suhbatdoshni qidirish...",
      deleted_listing: "O'chirilgan e'lon",
      unread_title: "O'qilmagan",
      read_title: "O'qilgan",
      delete_confirm: "Xabarni o'chirmoqchimisiz?"
    },
    ru: {
      back: "Назад",
      chat_placeholder: "Напишите сообщение...",
      guest_notice: "Гостевой пользователь. Связаться можно только по телефону.",
      select_chat: "Выберите чат, чтобы начать общение",
      call: "Позвонить",
      no_messages: "Диалоги не найдены",
      search_chat: "Поиск собеседника...",
      deleted_listing: "Удаленное объявление",
      unread_title: "Непрочитанное",
      read_title: "Прочитано",
      delete_confirm: "Вы действительно хотите удалить сообщение?"
    },
    en: {
      back: "Back",
      chat_placeholder: "Type a message...",
      guest_notice: "Guest user. Can only be contacted via phone.",
      select_chat: "Select a chat to start messaging",
      call: "Call",
      no_messages: "No conversations found",
      search_chat: "Search conversations...",
      deleted_listing: "Deleted listing",
      unread_title: "Unread",
      read_title: "Read",
      delete_confirm: "Are you sure you want to delete this message?"
    }
  };

  const currentText = localTexts[lang] || localTexts["uz"];

  const formatDateHeader = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (d.toDateString() === today.toDateString()) {
        return lang === "uz" ? "Bugun" : lang === "ru" ? "Сегодня" : "Today";
      } else if (d.toDateString() === yesterday.toDateString()) {
        return lang === "uz" ? "Kecha" : lang === "ru" ? "Вчера" : "Yesterday";
      } else {
        return d.toLocaleDateString(lang === "uz" ? "uz-UZ" : lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long" });
      }
    } catch {
      return "";
    }
  };

  // Group messages by contact phone
  const groupedThreads = {};
  messages.forEach((m) => {
    const isMeSender = m.senderId === user.id;
    const contactPhone = isMeSender ? m.receiverPhone : m.senderPhone;
    const contactName = isMeSender ? (m.receiverName || "Foydalanuvchi") : (m.senderName || "Mehmon");
    const contactId = isMeSender ? m.receiverId : m.senderId;

    if (!contactPhone) return;

    if (!groupedThreads[contactPhone]) {
      groupedThreads[contactPhone] = {
        contactPhone,
        contactName,
        contactId,
        messages: [],
        lastMessage: null,
        unreadCount: 0
      };
    }

    groupedThreads[contactPhone].messages.push(m);
    
    // Increment unread count for incoming unread messages
    if (!isMeSender && !m.isRead) {
      groupedThreads[contactPhone].unreadCount += 1;
    }
  });

  // Convert to array and sort by latest message date
  const threads = Object.values(groupedThreads).map((t) => {
    t.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    t.lastMessage = t.messages[t.messages.length - 1];
    return t;
  }).sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

  const filteredThreads = threads.filter((t) =>
    t.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.contactPhone.includes(searchQuery)
  );

  const activeThread = activeChatKey ? groupedThreads[activeChatKey] : null;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatKey, messages]);

  // Mark messages as read when active chat opens
  useEffect(() => {
    if (activeThread) {
      const unreadIncoming = activeThread.messages.filter(
        (m) => m.receiverId === user.id && !m.isRead
      );

      if (unreadIncoming.length > 0) {
        unreadIncoming.forEach(async (m) => {
          try {
            await markMessageReadAction(m.id);
          } catch (err) {
            console.error("Error marking read:", err);
          }
        });

        // Update local state instantly
        setMessages((prev) =>
          prev.map((msg) =>
            msg.receiverId === user.id && (msg.senderPhone === activeChatKey || msg.receiverPhone === activeChatKey) && !msg.isRead
              ? { ...msg, isRead: true }
              : msg
          )
        );
      }
    }
  }, [activeChatKey, messages.length]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeThread || sending) return;

    // Check guest
    if (!activeThread.contactId) {
      alert(currentText.guest_notice);
      return;
    }

    setSending(true);
    const lastMsg = activeThread.lastMessage;
    const contactId = activeThread.contactId;

    const formData = new FormData();
    formData.append("listing_id", lastMsg.listingId);
    formData.append("receiver_id", contactId);
    formData.append("content", replyText.trim());

    try {
      const res = await sendMessageAction(formData);
      if (res?.error) {
        alert(res.error);
      } else {
        // Append locally immediately
        const newMsg = {
          id: Date.now(), // Local temporary ID
          senderId: user.id,
          senderName: user.name,
          senderPhone: user.phone,
          receiverId: contactId,
          receiverName: activeThread.contactName,
          receiverPhone: activeThread.contactPhone,
          content: replyText.trim(),
          createdAt: new Date().toISOString(),
          listingId: lastMsg.listingId,
          listingType: lastMsg.listingType,
          isRead: false
        };
        setMessages((prev) => [...prev, newMsg]);
        setReplyText("");

        // Optimistik "Suhbatdosh yozmoqda..." simulyatsiyasi
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
          }, 3500);
        }, 1500);
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm(currentText.delete_confirm)) return;
    setDeletingId(messageId);
    try {
      const res = await deleteMessageAction(messageId);
      if (res?.error) {
        alert(res.error);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="tg-chat-container">
          <div className={`tg-chat-sidebar ${activeChatKey ? "mobile-hidden" : ""}`}>
            <div className="tg-mobile-header mobile-only">
              <BackButton fallback="/" className="tg-back-link">
                <i className="ti ti-arrow-left"></i>
              </BackButton>
              <span>{lang === "uz" ? "Xabarlar" : lang === "ru" ? "Сообщения" : "Messages"}</span>
              <div style={{ width: 36 }}></div>
            </div>
            <div className="tg-chat-search">
              <input
                placeholder={currentText.search_chat}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="tg-threads-list">
              {filteredThreads.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  <i className="ti ti-messages" style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.3 }}></i>
                  {currentText.no_messages}
                </div>
              ) : (
                filteredThreads.map((tItem) => {
                  const initials = tItem.contactName
                    ?.split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "M";
                  const isActive = activeChatKey === tItem.contactPhone;

                  return (
                    <div
                      key={tItem.contactPhone}
                      className={`tg-thread-item ${isActive ? "active" : ""}`}
                      onClick={() => setActiveChatKey(tItem.contactPhone)}
                    >
                      <div className="tg-avatar">{initials}</div>
                      <div className="tg-thread-info">
                        <div className="tg-thread-top">
                          <div className="tg-thread-name">{tItem.contactName}</div>
                          <div className="tg-thread-time">
                            {tItem.lastMessage?.createdAt
                              ? formatTime(tItem.lastMessage.createdAt)
                              : ""}
                          </div>
                        </div>
                        <div className="tg-thread-bottom">
                          <div className="tg-thread-preview">
                            {tItem.lastMessage?.content}
                          </div>
                          {tItem.unreadCount > 0 && (
                            <div className="tg-unread-badge">{tItem.unreadCount}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Content Window */}
          <div className={`tg-chat-content ${!activeChatKey ? "mobile-hidden" : ""}`}>
            {activeThread ? (
              <>
                {/* Chat Header */}
                <div className="tg-chat-header">
                  <div className="tg-chat-header-user">
                    <button className="tg-chat-btn" onClick={() => setActiveChatKey(null)} style={{ padding: "6px 10px" }}>
                      <i className="ti ti-arrow-left"></i> {currentText.back}
                    </button>
                    <div>
                      <div className="tg-chat-header-title">
                        {activeThread.contactName}
                      </div>
                      <div className="tg-chat-header-meta">
                        <i className="ti ti-building" style={{ fontSize: 13 }}></i>{" "}
                        {activeThread.lastMessage?.listingType || currentText.deleted_listing}
                      </div>
                    </div>
                  </div>
                  <div className="tg-chat-header-actions">
                    <a href={`tel:${activeThread.contactPhone}`} className="tg-chat-btn">
                      <i className="ti ti-phone"></i> {activeThread.contactPhone}
                    </a>
                  </div>
                </div>

                {/* Chat Message Bubble area */}
                <div className="tg-chat-messages">
                  {(() => {
                    let lastDateHeader = "";
                    return activeThread.messages.map((m) => {
                      const dateHeader = formatDateHeader(m.createdAt);
                      const showHeader = dateHeader !== lastDateHeader;
                      if (showHeader) {
                        lastDateHeader = dateHeader;
                      }

                      const isMe = m.senderId === user.id;

                      return (
                        <div key={m.id} style={{ display: "contents" }}>
                          {showHeader && (
                            <div className="tg-date-divider">
                              <span>{dateHeader}</span>
                            </div>
                          )}
                          <div className={`tg-msg-bubble ${isMe ? "tg-msg-bubble-out" : "tg-msg-bubble-in"}`}>
                            {m.content}
                            <div className="tg-msg-meta">
                              {formatTime(m.createdAt)}
                              {isMe && (
                                <i
                                  className={m.isRead ? "ti ti-checks" : "ti ti-check"}
                                  style={{
                                    fontSize: 12,
                                    marginLeft: 2,
                                    color: m.isRead ? "#fff" : "rgba(255,255,255,0.7)"
                                  }}
                                  title={m.isRead ? currentText.read_title : currentText.unread_title}
                                ></i>
                              )}
                              {!isMe && (
                                <button
                                  onClick={() => handleDeleteMessage(m.id)}
                                  disabled={deletingId === m.id}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--muted)",
                                    cursor: "pointer",
                                    padding: "0 2px",
                                    marginLeft: 6
                                  }}
                                  title={t("delete")}
                                >
                                  <i className="ti ti-trash" style={{ fontSize: 11 }}></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  {isTyping && (
                    <div className="tg-msg-bubble tg-msg-bubble-in" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginTop: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{activeThread.contactName} yozmoqda</span>
                      <span className="typing-indicator-dots" style={{ display: "flex", gap: 3 }}>
                        <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--orange)", animation: "dot-pulse 1s infinite alternate" }}></span>
                        <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--orange)", animation: "dot-pulse 1s infinite alternate 0.2s" }}></span>
                        <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--orange)", animation: "dot-pulse 1s infinite alternate 0.4s" }}></span>
                      </span>
                    </div>
                  )}
                  <style>{`
                    @keyframes dot-pulse {
                      from { opacity: 0.3; transform: scale(0.8); }
                      to { opacity: 1; transform: scale(1.2); }
                    }
                  `}</style>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="tg-chat-input-wrapper">
                  {activeThread.contactId ? (
                    <form onSubmit={handleSend} className="tg-chat-input-bar">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={currentText.chat_placeholder}
                        maxLength={500}
                      />
                      <button
                        type="submit"
                        className="tg-send-btn"
                        disabled={sending || !replyText.trim()}
                      >
                        <i className="ti ti-send"></i>
                      </button>
                    </form>
                  ) : (
                    <div style={{
                      textAlign: "center",
                      padding: "10px 14px",
                      background: "rgba(242, 89, 31, 0.05)",
                      color: "var(--orange)",
                      borderRadius: 14,
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    }}>
                      <i className="ti ti-alert-circle" style={{ fontSize: 16 }}></i>
                      {currentText.guest_notice}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="tg-empty-state">
                <i className="ti ti-brand-telegram"></i>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
                  {currentText.select_chat}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
