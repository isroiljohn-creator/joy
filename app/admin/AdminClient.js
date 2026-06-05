"use client";
import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/ui";
import { 
  adminApproveListingAction, 
  adminToggleTopListingAction, 
  adminDeleteListingAction, 
  adminUpdateUserRoleAction, 
  adminDeleteUserAction 
} from "@/app/actions";

function formatDate(dateVal) {
  try {
    if (!dateVal) return "";
    return new Date(dateVal).toLocaleDateString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(dateVal || "");
  }
}

export default function AdminClient({ user, stats, listings, users, messages }) {
  const [tab, setTab] = useState("E'lonlar");

  // Local state for instant UI updates
  const [localListings, setLocalListings] = useState(listings);
  const [localUsers, setLocalUsers] = useState(users);
  const [localMessages, setLocalMessages] = useState(messages);

  // Search and filter states
  const [listingsSearch, setListingsSearch] = useState("");
  const [listingsStatus, setListingsStatus] = useState("all");
  const [listingsCategory, setListingsCategory] = useState("all");

  const [usersSearch, setUsersSearch] = useState("");
  const [messagesSearch, setMessagesSearch] = useState("");

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  // 1. Action Handlers
  const handleApprove = async (id) => {
    if (actionLoading[id]) return;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await adminApproveListingAction(id);
      if (res?.error) {
        alert(res.error);
      } else {
        setLocalListings(prev => 
          prev.map(l => l.id === id ? { ...l, status: "active" } : l)
        );
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleToggleTop = async (id) => {
    const key = `top-${id}`;
    if (actionLoading[key]) return;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await adminToggleTopListingAction(id);
      if (res?.error) {
        alert(res.error);
      } else {
        setLocalListings(prev => 
          prev.map(l => l.id === id ? { ...l, top: !l.top } : l)
        );
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteListing = async (id) => {
    if (!confirm("Haqiqatan ham ushbu e'lonni o'chirmoqchimisiz? Bu amal orqaga qaytarilmaydi!")) return;
    const key = `delete-listing-${id}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await adminDeleteListingAction(id);
      if (res?.error) {
        alert(res.error);
      } else {
        setLocalListings(prev => prev.filter(l => l.id !== id));
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (userId === user.id) {
      alert("O'z rolingizni o'zgartira olmaysiz!");
      return;
    }
    if (!confirm(`Foydalanuvchi rolini '${newRole}' ga o'zgartirmoqchimisiz?`)) return;

    const key = `role-${userId}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await adminUpdateUserRoleAction(userId, newRole);
      if (res?.error) {
        alert(res.error);
      } else {
        setLocalUsers(prev => 
          prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
        );
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === user.id) {
      alert("O'zingizni o'chira olmaysiz!");
      return;
    }
    if (!confirm("Haqiqatan ham ushbu foydalanuvchini butunlay o'chirmoqchimisiz? Barcha e'lonlar va xabarlar o'chib ketadi!")) return;

    const key = `delete-user-${userId}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await adminDeleteUserAction(userId);
      if (res?.error) {
        alert(res.error);
      } else {
        setLocalUsers(prev => prev.filter(u => u.id !== userId));
        // Foydalanuvchi o'chgandan keyin uning e'lonlarini ham mahalliy ro'yxatdan o'chiramiz
        setLocalListings(prev => prev.filter(l => l.ownerId !== userId));
      }
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Filtered lists
  const filteredListings = localListings.filter(l => {
    const matchesSearch = 
      l.type?.toLowerCase().includes(listingsSearch.toLowerCase()) ||
      l.addr?.toLowerCase().includes(listingsSearch.toLowerCase()) ||
      l.owner?.toLowerCase().includes(listingsSearch.toLowerCase()) ||
      l.phone?.includes(listingsSearch);
    
    const matchesStatus = listingsStatus === "all" ? true : l.status === listingsStatus;
    const matchesCategory = listingsCategory === "all" ? true : l.cat === listingsCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const filteredUsers = localUsers.filter(u => 
    u.name?.toLowerCase().includes(usersSearch.toLowerCase()) ||
    u.phone?.includes(usersSearch) ||
    u.role?.toLowerCase().includes(usersSearch.toLowerCase())
  );

  const filteredMessages = localMessages.filter(m => 
    m.sender_name?.toLowerCase().includes(messagesSearch.toLowerCase()) ||
    m.sender_phone?.includes(messagesSearch) ||
    m.content?.toLowerCase().includes(messagesSearch.toLowerCase()) ||
    m.listing_title?.toLowerCase().includes(messagesSearch.toLowerCase())
  );

  // Stats calculation
  const categoryCounts = localListings.reduce((acc, l) => {
    acc[l.cat] = (acc[l.cat] || 0) + 1;
    return acc;
  }, {});

  const totalViewsCalculated = localListings.reduce((sum, l) => sum + (l.views || 0), 0);

  return (
    <>
      <Nav />
      <div className="wrap">
        <style dangerouslySetInnerHTML={{ __html: `
          .admin-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .admin-badge.active {
            background: var(--green-tint);
            color: var(--green);
          }
          .admin-badge.pending {
            background: var(--amber-tint);
            color: var(--amber);
          }
          .admin-badge.admin {
            background: var(--purple-tint);
            color: var(--purple);
          }
          .admin-badge.user {
            background: #eee;
            color: var(--text2);
          }
          .admin-badge.top-badge {
            background: var(--orange-tint);
            color: var(--orange-dark);
          }
          .admin-badge.normal-badge {
            background: var(--blue-tint);
            color: var(--blue);
          }
          .admin-table-container {
            background: #fff;
            border: 1px solid var(--sand);
            border-radius: 20px;
            overflow: hidden;
            margin-bottom: 64px;
            box-shadow: 0 10px 30px rgba(26,19,14,.02);
          }
          .admin-table-wrap {
            overflow-x: auto;
          }
          .admin-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 14px;
            min-width: 800px;
          }
          .admin-table th {
            background: var(--cream);
            padding: 16px;
            font-weight: 600;
            color: var(--text2);
            border-bottom: 1px solid var(--sand);
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .admin-table td {
            padding: 16px;
            border-bottom: 1px solid var(--sand);
            vertical-align: middle;
          }
          .admin-table tr:last-child td {
            border-bottom: none;
          }
          .admin-table tr:hover td {
            background: rgba(251,247,243,0.5);
          }
          .admin-btn {
            border: 1px solid var(--sand);
            background: #fff;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
            color: var(--ink);
          }
          .admin-btn:hover {
            border-color: var(--muted);
            background: var(--cream);
          }
          .admin-btn-approve {
            background: var(--green-tint);
            color: var(--green);
            border-color: transparent;
          }
          .admin-btn-approve:hover {
            background: var(--green);
            color: #fff;
          }
          .admin-btn-delete {
            background: #fdeae2;
            color: var(--orange-dark);
            border-color: transparent;
          }
          .admin-btn-delete:hover {
            background: var(--orange);
            color: #fff;
          }
          .admin-btn-star {
            color: var(--amber);
            background: var(--amber-tint);
            border-color: transparent;
          }
          .admin-btn-star:hover {
            background: var(--amber);
            color: #fff;
          }
          .admin-btn-role {
            background: var(--blue-tint);
            color: var(--blue);
            border-color: transparent;
          }
          .admin-btn-role:hover {
            background: var(--blue);
            color: #fff;
          }
          .admin-filter-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 20px;
            align-items: center;
          }
          .admin-search-input {
            flex: 1;
            min-width: 260px;
            background: #fff;
            border: 1px solid var(--sand);
            border-radius: 14px;
            padding: 10px 16px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
          }
          .admin-search-input:focus {
            border-color: var(--orange);
          }
          .admin-select {
            background: #fff;
            border: 1px solid var(--sand);
            border-radius: 14px;
            padding: 10px 16px;
            font-size: 14px;
            outline: none;
            cursor: pointer;
            min-width: 150px;
          }
          .admin-select:focus {
            border-color: var(--orange);
          }
          .admin-user-cell {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .admin-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--orange-tint);
            color: var(--orange-dark);
            font-weight: 700;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .admin-stat-card {
            background: #fff;
            border: 1px solid var(--sand);
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(26,19,14,.02);
            transition: transform 0.2s;
          }
          .admin-stat-card:hover {
            transform: translateY(-2px);
          }
          .admin-stat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            color: var(--muted);
          }
          .admin-stat-header i {
            font-size: 24px;
            color: var(--orange);
          }
          .admin-stat-value {
            font-family: 'Bricolage Grotesque', sans-serif;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .admin-stat-label {
            font-size: 13px;
            color: var(--muted);
          }
          .admin-stat-progress-bar {
            height: 6px;
            background: var(--sand);
            border-radius: 3px;
            overflow: hidden;
            margin-top: 12px;
          }
          .admin-stat-progress-fill {
            height: 100%;
            background: var(--orange);
            border-radius: 3px;
          }
          @media(max-width: 768px) {
            .admin-table-container {
              border-radius: 12px;
            }
            .admin-stat-card {
              padding: 16px;
            }
            .admin-stat-value {
              font-size: 26px;
            }
          }
        `}} />

        {/* Header section */}
        <div className="phead">
          <div className="bigav" style={{ background: "var(--ink)", color: "var(--cream)" }}>
            A
          </div>
          <div>
            <div className="hname display">
              Admin Panel <span style={{ fontSize: 13, verticalAlign: "middle", background: "var(--orange)", color: "#fff", padding: "3px 8px", borderRadius: 8, marginLeft: 8 }}>TIZIM</span>
            </div>
            <div className="hmeta">
              <span>
                <i className="ti ti-user-check"></i> {user?.name} ({user?.phone})
              </span>
              <span>
                <i className="ti ti-lock-open"></i> Administrator huquqlari
              </span>
            </div>
          </div>
          <Link className="editp" href="/profile" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-arrow-left"></i> Profilga qaytish
          </Link>
        </div>

        {/* Stats grid */}
        <div className="pstats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span>E'lonlar</span>
              <i className="ti ti-files"></i>
            </div>
            <div className="admin-stat-value">{localListings.length}</div>
            <div className="admin-stat-label">
              {localListings.filter(l => l.status === "active").length} faol, {localListings.filter(l => l.status === "pending").length} moderatsiyada
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span>Foydalanuvchilar</span>
              <i className="ti ti-users"></i>
            </div>
            <div className="admin-stat-value">{localUsers.length}</div>
            <div className="admin-stat-label">
              {localUsers.filter(u => u.role === "admin").length} admin, {localUsers.filter(u => u.role !== "admin").length} foydalanuvchi
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span>Xabarlar</span>
              <i className="ti ti-messages"></i>
            </div>
            <div className="admin-stat-value">{localMessages.length}</div>
            <div className="admin-stat-label">Platformadagi yozishmalar soni</div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <span>Ko'rishlar</span>
              <i className="ti ti-eye"></i>
            </div>
            <div className="admin-stat-value">{totalViewsCalculated.toLocaleString()}</div>
            <div className="admin-stat-label">E'lonlarning jami ko'rilganligi</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="ptabs" style={{ marginBottom: 24 }}>
          {["E'lonlar", "Foydalanuvchilar", "Xabarlar", "Statistika"].map((t) => (
            <div
              key={t}
              className={"ptab" + (tab === t ? " on" : "")}
              onClick={() => setTab(t)}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Tab Contents */}
        
        {/* Tab 1: E'lonlar */}
        {tab === "E'lonlar" && (
          <>
            <div className="admin-filter-bar">
              <input
                className="admin-search-input"
                placeholder="E'lon nomi, manzil yoki egasi bo'yicha qidiring..."
                value={listingsSearch}
                onChange={(e) => setListingsSearch(e.target.value)}
              />
              <select
                className="admin-select"
                value={listingsStatus}
                onChange={(e) => setListingsStatus(e.target.value)}
              >
                <option value="all">Barcha statuslar</option>
                <option value="active">Faol</option>
                <option value="pending">Moderatsiyada</option>
              </select>
              <select
                className="admin-select"
                value={listingsCategory}
                onChange={(e) => setListingsCategory(e.target.value)}
              >
                <option value="all">Barcha toifalar</option>
                <option value="Yangi uylar">Yangi uylar</option>
                <option value="Ikkilamchi">Ikkilamchi</option>
                <option value="Ijara">Ijara</option>
                <option value="Ofis">Ofis</option>
              </select>
            </div>

            {filteredListings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)", background: "#fff", borderRadius: 20, border: "1px solid var(--sand)" }}>
                <i className="ti ti-files" style={{ fontSize: 40, display: "block", marginBottom: 12 }}></i>
                Mos keluvchi e'lonlar topilmadi.
              </div>
            ) : (
              <div className="admin-table-container">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: 70 }}>Rasm</th>
                        <th>E'lon turi / Joylashuv</th>
                        <th>Egasi</th>
                        <th>Narxi</th>
                        <th>Status</th>
                        <th>Top</th>
                        <th style={{ width: 220, textAlign: "right" }}>Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredListings.map((l) => (
                        <tr key={l.id}>
                          <td>
                            <div
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 10,
                                backgroundImage: `url('${l.photo}')`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                border: "1px solid var(--sand)",
                                backgroundColor: "#C9BDA8"
                              }}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              <Link href={`/property/${l.id}`} style={{ color: "var(--ink)" }} className="hover-orange">
                                {l.type}
                              </Link>
                            </div>
                            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                              <i className="ti ti-map-pin" style={{ fontSize: 13 }}></i> {l.addr}
                            </div>
                            <span style={{
                              display: "inline-block", 
                              fontSize: 10, 
                              fontWeight: 600, 
                              padding: "2px 6px", 
                              borderRadius: 6, 
                              marginTop: 6,
                              background: l.cat === "Yangi uylar" ? "var(--orange-tint)" : l.cat === "Ikkilamchi" ? "var(--blue-tint)" : l.cat === "Ijara" ? "var(--amber-tint)" : "var(--purple-tint)",
                              color: l.cat === "Yangi uylar" ? "var(--orange-dark)" : l.cat === "Ikkilamchi" ? "var(--blue)" : l.cat === "Ijara" ? "var(--amber)" : "var(--purple)"
                            }}>
                              {l.cat}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{l.owner}</div>
                            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{l.phone}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--ink)" }}>{l.price}</div>
                          </td>
                          <td>
                            <span className={`admin-badge ${l.status}`}>
                              {l.status === "active" ? "Faol" : "Kutilmoqda"}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-badge ${l.top ? "top-badge" : "normal-badge"}`}>
                              {l.top ? "TOP" : "Oddiy"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: 8 }}>
                              {l.status === "pending" && (
                                <button
                                  className="admin-btn admin-btn-approve"
                                  onClick={() => handleApprove(l.id)}
                                  disabled={actionLoading[l.id]}
                                  title="Tasdiqlash va faollashtirish"
                                >
                                  <i className={actionLoading[l.id] ? "ti ti-loader rotate" : "ti ti-check"}></i>
                                  {actionLoading[l.id] ? "" : "Tasdiqlash"}
                                </button>
                              )}
                              <button
                                className="admin-btn admin-btn-star"
                                onClick={() => handleToggleTop(l.id)}
                                disabled={actionLoading[`top-${l.id}`]}
                                title={l.top ? "TOP dan olish" : "TOP ga chiqarish"}
                              >
                                <i className={actionLoading[`top-${l.id}`] ? "ti ti-loader rotate" : (l.top ? "ti ti-star-filled" : "ti ti-star")}></i>
                              </button>
                              <button
                                className="admin-btn admin-btn-delete"
                                onClick={() => handleDeleteListing(l.id)}
                                disabled={actionLoading[`delete-listing-${l.id}`]}
                                title="E'lonni o'chirish"
                              >
                                <i className={actionLoading[`delete-listing-${l.id}`] ? "ti ti-loader rotate" : "ti ti-trash"}></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Foydalanuvchilar */}
        {tab === "Foydalanuvchilar" && (
          <>
            <div className="admin-filter-bar">
              <input
                className="admin-search-input"
                placeholder="Foydalanuvchi ismi, telefon raqami yoki roli bo'yicha qidiring..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)", background: "#fff", borderRadius: 20, border: "1px solid var(--sand)" }}>
                <i className="ti ti-users-minus" style={{ fontSize: 40, display: "block", marginBottom: 12 }}></i>
                Mos keluvchi foydalanuvchilar topilmadi.
              </div>
            ) : (
              <div className="admin-table-container">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>ID</th>
                        <th>Foydalanuvchi</th>
                        <th>Telefon raqami</th>
                        <th>Roli</th>
                        <th>Ro'yxatdan o'tgan sana</th>
                        <th style={{ width: 260, textAlign: "right" }}>Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600, color: "var(--muted)" }}>#{u.id}</td>
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-avatar">
                                {u.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div style={{ fontWeight: 600 }}>{u.name}</div>
                            </div>
                          </td>
                          <td>{u.phone}</td>
                          <td>
                            <span className={`admin-badge ${u.role}`}>
                              {u.role === "admin" ? "Admin" : "Foydalanuvchi"}
                            </span>
                          </td>
                          <td>{formatDate(u.created_at)}</td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: 8 }}>
                              <button
                                className="admin-btn admin-btn-role"
                                onClick={() => handleRoleChange(u.id, u.role)}
                                disabled={u.id === user.id || actionLoading[`role-${u.id}`]}
                                title={u.role === "admin" ? "User rolini berish" : "Admin rolini berish"}
                                style={{ opacity: u.id === user.id ? 0.5 : 1, cursor: u.id === user.id ? "not-allowed" : "pointer" }}
                              >
                                <i className={actionLoading[`role-${u.id}`] ? "ti ti-loader rotate" : "ti ti-shield"}></i>
                                {u.role === "admin" ? "User qilish" : "Admin qilish"}
                              </button>
                              <button
                                className="admin-btn admin-btn-delete"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={u.id === user.id || actionLoading[`delete-user-${u.id}`]}
                                title="Foydalanuvchini o'chirish"
                                style={{ opacity: u.id === user.id ? 0.5 : 1, cursor: u.id === user.id ? "not-allowed" : "pointer" }}
                              >
                                <i className={actionLoading[`delete-user-${u.id}`] ? "ti ti-loader rotate" : "ti ti-user-x"}></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 3: Xabarlar */}
        {tab === "Xabarlar" && (
          <>
            <div className="admin-filter-bar">
              <input
                className="admin-search-input"
                placeholder="Yozuvchi ismi, telefon, e'lon yoki matn bo'yicha qidiring..."
                value={messagesSearch}
                onChange={(e) => setMessagesSearch(e.target.value)}
              />
            </div>

            {filteredMessages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "var(--muted)", background: "#fff", borderRadius: 20, border: "1px solid var(--sand)" }}>
                <i className="ti ti-message-circle-off" style={{ fontSize: 40, display: "block", marginBottom: 12 }}></i>
                Mos keluvchi xabarlar topilmadi.
              </div>
            ) : (
              <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 64 }}>
                {filteredMessages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "#fff",
                      border: "1px solid var(--sand)",
                      borderRadius: 18,
                      padding: 20,
                      marginBottom: 16,
                      boxShadow: "0 6px 12px rgba(26,19,14,0.01)"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 10,
                        borderBottom: "1px solid var(--sand)",
                        paddingBottom: 10
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                          {m.sender_name}
                          <span style={{ fontSize: 10, background: "#eee", color: "var(--text2)", padding: "2px 6px", borderRadius: 6, fontWeight: 500 }}>
                            ID: #{m.sender_id || "Mehmon"}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                          <i className="ti ti-phone" style={{ fontSize: 13 }}></i> {m.sender_phone}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--orange-dark)" }}>
                          E'lon: {m.listing_title || "O'chirilgan e'lon"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          {formatDate(m.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.5, background: "var(--cream)", padding: 12, borderRadius: 12 }}>
                      {m.content}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
                      <span>Qabul qiluvchi User ID: <strong>#{m.receiver_id}</strong> ({m.receiver_user_name || "Noma'lum"})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 4: Statistika */}
        {tab === "Statistika" && (
          <div style={{ paddingBottom: 64 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
              
              {/* E'lonlar toifalar bo'yicha */}
              <div style={{ background: "#fff", border: "1px solid var(--sand)", borderRadius: 20, padding: 24, boxShadow: "0 10px 30px rgba(26,19,14,.02)" }}>
                <h3 className="display" style={{ fontSize: 18, marginBottom: 20 }}>
                  Toifalar bo'yicha e'lonlar
                </h3>
                {["Yangi uylar", "Ikkilamchi", "Ijara", "Ofis"].map(cat => {
                  const count = categoryCounts[cat] || 0;
                  const percent = localListings.length > 0 ? (count / localListings.length) * 100 : 0;
                  return (
                    <div key={cat} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                        <span>{cat}</span>
                        <span style={{ color: "var(--orange-dark)" }}>{count} ta ({Math.round(percent)}%)</span>
                      </div>
                      <div className="admin-stat-progress-bar" style={{ marginTop: 0 }}>
                        <div className="admin-stat-progress-fill" style={{ width: `${percent}%`, background: cat === "Yangi uylar" ? "var(--orange)" : cat === "Ikkilamchi" ? "var(--blue)" : cat === "Ijara" ? "var(--amber)" : "var(--purple)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Moderatsiya holati */}
              <div style={{ background: "#fff", border: "1px solid var(--sand)", borderRadius: 20, padding: 24, boxShadow: "0 10px 30px rgba(26,19,14,.02)" }}>
                <h3 className="display" style={{ fontSize: 18, marginBottom: 20 }}>
                  Moderatsiya holati
                </h3>
                
                {/* Active progress */}
                {(() => {
                  const activeCount = localListings.filter(l => l.status === "active").length;
                  const activePercent = localListings.length > 0 ? (activeCount / localListings.length) * 100 : 0;
                  
                  const pendingCount = localListings.filter(l => l.status === "pending").length;
                  const pendingPercent = localListings.length > 0 ? (pendingCount / localListings.length) * 100 : 0;

                  return (
                    <>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                          <span style={{ color: "var(--green)" }}><i className="ti ti-circle-check"></i> Faol e'lonlar</span>
                          <strong>{activeCount} ta ({Math.round(activePercent)}%)</strong>
                        </div>
                        <div className="admin-stat-progress-bar" style={{ marginTop: 0 }}>
                          <div className="admin-stat-progress-fill" style={{ width: `${activePercent}%`, background: "var(--green)" }} />
                        </div>
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                          <span style={{ color: "var(--amber)" }}><i className="ti ti-clock"></i> Moderatsiyadagilar</span>
                          <strong>{pendingCount} ta ({Math.round(pendingPercent)}%)</strong>
                        </div>
                        <div className="admin-stat-progress-bar" style={{ marginTop: 0 }}>
                          <div className="admin-stat-progress-fill" style={{ width: `${pendingPercent}%`, background: "var(--amber)" }} />
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div style={{ borderTop: "1px solid var(--sand)", paddingTop: 16, marginTop: 16, fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>
                  <i className="ti ti-info-circle" style={{ color: "var(--orange)", fontSize: 16, marginRight: 4, verticalAlign: -2 }}></i>
                  Foydalanuvchilar e'lon qo'shganda birinchi moderatsiya statusida bo'ladi va admin tasdiqlagach faollashadi.
                </div>
              </div>

            </div>

            {/* Qo'shimcha statistika ko'rsatkichlari */}
            <div style={{ marginTop: 24, background: "#fff", border: "1px solid var(--sand)", borderRadius: 20, padding: 24, boxShadow: "0 10px 30px rgba(26,19,14,.02)" }}>
              <h3 className="display" style={{ fontSize: 18, marginBottom: 20 }}>
                Platforma samaradorligi va ko'rsatkichlari
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                <div style={{ padding: "16px", border: "1px solid var(--sand)", borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>O'rtacha ko'rishlar soni</div>
                  <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: 24, fontWeight: 700 }}>
                    {localListings.length > 0 ? Math.round(totalViewsCalculated / localListings.length) : 0} ta
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>har bir e'lon uchun</div>
                </div>

                <div style={{ padding: "16px", border: "1px solid var(--sand)", borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>O'rtacha saqlashlar soni</div>
                  <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: 24, fontWeight: 700 }}>
                    {localListings.length > 0 ? (localListings.reduce((sum, l) => sum + (l.saves || 0), 0) / localListings.length).toFixed(1) : 0} ta
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>har bir e'lon uchun</div>
                </div>

                <div style={{ padding: "16px", border: "1px solid var(--sand)", borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>O'rtacha e'lon/foydalanuvchi</div>
                  <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: 24, fontWeight: 700 }}>
                    {localUsers.length > 0 ? (localListings.length / localUsers.length).toFixed(1) : 0} ta
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>har bir foydalanuvchiga</div>
                </div>

                <div style={{ padding: "16px", border: "1px solid var(--sand)", borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Muloqot intensivligi</div>
                  <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: 24, fontWeight: 700 }}>
                    {localListings.length > 0 ? (localMessages.length / localListings.length).toFixed(1) : 0} ta
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>xabar/e'lon nisbati</div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </>
  );
}
