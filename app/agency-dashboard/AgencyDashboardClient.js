"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createAgencyAction,
  updateAgencyAction,
  addAgencyMemberAction,
  removeAgencyMemberAction,
  assignLeadAction,
  importFeedAction,
} from "@/app/actions";

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AgencyDashboardClient({ user, myAgency: initialAgency, members: initialMembers, leads: initialLeads, agencyListings }) {
  const router = useRouter();
  const [agency, setAgency] = useState(initialAgency);
  const [members, setMembers] = useState(initialMembers || []);
  const [leads, setLeads] = useState(initialLeads || []);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleBack = (e) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/profile");
    }
  };

  // Create agency form
  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    address: "",
    description: "",
    website: "",
  });

  // Add member form
  const [memberPhone, setMemberPhone] = useState("");

  // Feed import
  const [feedJson, setFeedJson] = useState("");
  const [feedResult, setFeedResult] = useState(null);
  const [showSchema, setShowSchema] = useState(false);

  const showMsg = (text, isError = false) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleCreateAgency = async (e) => {
    e.preventDefault();
    if (!createForm.name) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", createForm.name);
      formData.append("slug", slugify(createForm.name));
      formData.append("phone", createForm.phone);
      formData.append("address", createForm.address);
      formData.append("description", createForm.description);
      formData.append("website", createForm.website);
      const res = await createAgencyAction(formData);
      if (res?.error) {
        showMsg(res.error, true);
      } else {
        showMsg("Agentlik muvaffaqiyatli yaratildi! Sahifani yangilang.");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      showMsg("Xatolik yuz berdi", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberPhone.trim()) return;
    setLoading(true);
    try {
      const res = await addAgencyMemberAction(agency.id, memberPhone.trim());
      if (res?.error) {
        showMsg(res.error, true);
      } else {
        showMsg("Xodim qo'shildi!");
        setMemberPhone("");
        if (res.member) {
          setMembers(prev => [...prev, res.member]);
        }
      }
    } catch {
      showMsg("Xatolik yuz berdi", true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`${memberName} ni jamoadan chiqarasizmi?`)) return;
    setLoading(true);
    try {
      const res = await removeAgencyMemberAction(memberId);
      if (res?.error) {
        showMsg(res.error, true);
      } else {
        setMembers(prev => prev.filter(m => m.member_id !== memberId));
        showMsg("Xodim chiqarildi.");
      }
    } catch {
      showMsg("Xatolik yuz berdi", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLead = async (leadId, userId) => {
    try {
      const res = await assignLeadAction(leadId, parseInt(userId));
      if (res?.error) {
        showMsg(res.error, true);
      } else {
        const assignedMember = members.find(m => m.id === parseInt(userId));
        setLeads(prev => prev.map(l =>
          l.id === leadId
            ? { ...l, assigned_to: parseInt(userId), assigned_to_name: assignedMember?.name || "" }
            : l
        ));
        showMsg("Lid taqsimlandi!");
      }
    } catch {
      showMsg("Xatolik yuz berdi", true);
    }
  };

  const handleFeedImport = async () => {
    if (!feedJson.trim()) return;
    setLoading(true);
    setFeedResult(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(feedJson);
      } catch {
        showMsg("JSON format noto'g'ri. Iltimos, to'g'ri JSON kiriting.", true);
        setLoading(false);
        return;
      }
      const res = await importFeedAction(agency.id, parsed);
      if (res?.error) {
        showMsg(res.error, true);
      } else {
        setFeedResult(res);
        showMsg(`Import muvaffaqiyatli! ${res.imported} ta e'lon qo'shildi/yangilandi.`);
      }
    } catch {
      showMsg("Import paytida xatolik yuz berdi", true);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Umumiy", icon: "ti-chart-bar" },
    { id: "members", label: "Jamoa", icon: "ti-users" },
    { id: "leads", label: "Lidlar", icon: "ti-messages" },
    { id: "feed", label: "Feed Import", icon: "ti-upload" },
    { id: "settings", label: "Sozlamalar", icon: "ti-settings" },
  ];

  return (
    <>
      <div className="dashboard-header">
        <div className="wrap">
          <div className="dashboard-header-inner">
            <div className="dashboard-header-left">
              <Link href="/" onClick={handleBack} className="dashboard-back-btn">
                <i className="ti ti-arrow-left"></i> Orqaga
              </Link>
              <div className="dashboard-title-block">
                <h1 className="dashboard-title">
                  {agency ? agency.name : "Agentlik Dashboard"}
                </h1>
                <p className="dashboard-subtitle">
                  {agency
                    ? `${agencyListings.length} e'lon · ${members.length} makler`
                    : "Agentligingizni yarating"}
                </p>
              </div>
            </div>
            {agency && (
              <Link href={`/agencies/${agency.slug}`} className="btn btn-secondary" target="_blank">
                <i className="ti ti-external-link"></i> Sahifani ko'rish
              </Link>
            )}
          </div>
        </div>
      </div>

      {msg && (
        <div className={`dashboard-msg ${msg.includes("xatolik") || msg.includes("noto'g'ri") ? "error" : "success"}`}>
          {msg}
        </div>
      )}

      <div className="wrap" style={{ paddingBottom: 80 }}>
        {!agency ? (
          /* Create Agency Form */
          <div className="dashboard-create-agency">
            <div className="create-agency-card">
              <div className="create-agency-icon">
                <i className="ti ti-building-store"></i>
              </div>
              <h2>Agentlik Yaratish</h2>
              <p>Joy.uz da o'z rieltorlik kompaniyangizni oching. Xodimlarni qo'shing, e'lonlarni boshqaring.</p>
              <form onSubmit={handleCreateAgency} className="create-agency-form">
                <div className="form-group">
                  <label>Agentlik nomi *</label>
                  <input
                    type="text"
                    placeholder="Masalan: Grand Realty"
                    value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Telefon raqami</label>
                    <input
                      type="text"
                      placeholder="+998 90 000 00 00"
                      value={createForm.phone}
                      onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Veb-sayt</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={createForm.website}
                      onChange={e => setCreateForm(p => ({ ...p, website: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Manzil</label>
                  <input
                    type="text"
                    placeholder="Toshkent, Chilonzor tumani..."
                    value={createForm.address}
                    onChange={e => setCreateForm(p => ({ ...p, address: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Agentlik haqida</label>
                  <textarea
                    placeholder="Kompaniyangiz haqida qisqacha..."
                    rows={3}
                    value={createForm.description}
                    onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? <><i className="ti ti-loader-2 spin"></i> Yaratilmoqda...</> : <><i className="ti ti-building-plus"></i> Agentlik yaratish</>}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Agency exists — show dashboard */
          <>
            {/* Tabs */}
            <div className="dashboard-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`dashboard-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`ti ${tab.icon}`}></i>
                  <span>{tab.label}</span>
                  {tab.id === "leads" && leads.filter(l => !l.assigned_to).length > 0 && (
                    <span className="tab-badge">{leads.filter(l => !l.assigned_to).length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="dashboard-content">
                <div className="dashboard-stats-grid">
                  <div className="dashboard-stat-card">
                    <i className="ti ti-home"></i>
                    <div className="stat-value">{agencyListings.length}</div>
                    <div className="stat-label">Jami e'lonlar</div>
                  </div>
                  <div className="dashboard-stat-card">
                    <i className="ti ti-users"></i>
                    <div className="stat-value">{members.length}</div>
                    <div className="stat-label">Maklerlar</div>
                  </div>
                  <div className="dashboard-stat-card">
                    <i className="ti ti-messages"></i>
                    <div className="stat-value">{leads.length}</div>
                    <div className="stat-label">Jami lidlar</div>
                  </div>
                  <div className="dashboard-stat-card highlight">
                    <i className="ti ti-alert-circle"></i>
                    <div className="stat-value">{leads.filter(l => !l.assigned_to).length}</div>
                    <div className="stat-label">Taqsimlanmagan</div>
                  </div>
                </div>

                <h3 className="section-title">So'nggi e'lonlar</h3>
                {agencyListings.length === 0 ? (
                  <div className="empty-state-small">
                    <i className="ti ti-home-off"></i>
                    <p>Hali e'lonlar yo'q. E'lon qo'shishda agency_id ni tanlang.</p>
                  </div>
                ) : (
                  <div className="dashboard-listings-table">
                    <table>
                      <thead>
                        <tr>
                          <th>E'lon</th>
                          <th>Narx</th>
                          <th>Ko'rishlar</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {agencyListings.slice(0, 10).map(l => (
                          <tr key={l.id}>
                            <td>
                              <div className="listing-td-name">{l.type}</div>
                              <div className="listing-td-addr">{l.addr}</div>
                            </td>
                            <td><strong>{l.price}</strong></td>
                            <td>{l.views}</td>
                            <td>
                              <span className={`status-badge ${l.status}`}>{l.status}</span>
                            </td>
                            <td>
                              <Link href={`/property/${l.id}`} className="btn-icon" target="_blank">
                                <i className="ti ti-external-link"></i>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="dashboard-content">
                <div className="members-section">
                  <div className="members-header">
                    <h3>Jamoa a'zolari</h3>
                    <form onSubmit={handleAddMember} className="add-member-form">
                      <input
                        type="text"
                        placeholder="Xodim telefon raqami..."
                        value={memberPhone}
                        onChange={e => setMemberPhone(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        <i className="ti ti-user-plus"></i> Qo'shish
                      </button>
                    </form>
                  </div>
                  <div className="members-list-dashboard">
                    {members.length === 0 ? (
                      <div className="empty-state-small">
                        <i className="ti ti-users-off"></i>
                        <p>Hali xodimlar yo'q. Telefon raqami orqali qo'shing.</p>
                      </div>
                    ) : (
                      members.map(m => (
                        <div key={m.member_id} className="member-row">
                          <div className="member-avatar-sm">{m.name?.[0]?.toUpperCase()}</div>
                          <div className="member-details">
                            <div className="member-name">{m.name}</div>
                            <div className="member-phone">{m.phone}</div>
                          </div>
                          <span className={`role-badge ${m.role}`}>
                            {m.role === "owner" ? "Rahbar" : "Makler"}
                          </span>
                          {m.role !== "owner" && (
                            <button
                              className="btn-icon danger"
                              onClick={() => handleRemoveMember(m.member_id, m.name)}
                              disabled={loading}
                            >
                              <i className="ti ti-user-minus"></i>
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Leads Tab */}
            {activeTab === "leads" && (
              <div className="dashboard-content">
                <h3>Kelgan Lidlar (xabarlar)</h3>
                {leads.length === 0 ? (
                  <div className="empty-state-small">
                    <i className="ti ti-messages-off"></i>
                    <p>Hali lidlar yo'q.</p>
                  </div>
                ) : (
                  <div className="leads-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Kim yubordi</th>
                          <th>E'lon</th>
                          <th>Xabar</th>
                          <th>Sana</th>
                          <th>Taqsimlash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map(lead => (
                          <tr key={lead.id} className={!lead.assigned_to ? "unassigned" : ""}>
                            <td>
                              <div className="lead-sender">{lead.sender_name}</div>
                              <a href={`tel:${lead.sender_phone}`} className="lead-phone">
                                {lead.sender_phone}
                              </a>
                            </td>
                            <td>
                              <div style={{ fontSize: 13 }}>{lead.listing_type}</div>
                              <div style={{ fontSize: 11, opacity: 0.6 }}>{lead.listing_addr}</div>
                            </td>
                            <td>
                              <div className="lead-content">{lead.content?.slice(0, 60)}{lead.content?.length > 60 ? "..." : ""}</div>
                            </td>
                            <td style={{ fontSize: 12, opacity: 0.6, whiteSpace: "nowrap" }}>
                              {new Date(lead.createdAt).toLocaleDateString("uz-UZ")}
                            </td>
                            <td>
                              {members.length > 0 ? (
                                <select
                                  value={lead.assigned_to || ""}
                                  onChange={e => handleAssignLead(lead.id, e.target.value)}
                                  className="lead-assign-select"
                                >
                                  <option value="">Taqsimlang...</option>
                                  {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>Avval xodim qo'shing</span>
                              )}
                              {lead.assigned_to_name && (
                                <div style={{ fontSize: 11, color: "var(--green)", marginTop: 2 }}>
                                  ✓ {lead.assigned_to_name}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Feed Import Tab */}
            {activeTab === "feed" && (
              <div className="dashboard-content">
                <div className="feed-import-card" style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--sand)",
                  borderRadius: "24px",
                  padding: "24px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.04)"
                }}>
                  <div className="feed-import-header" style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <div style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "14px",
                        background: "var(--orange-tint)",
                        color: "var(--orange)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px"
                      }}>
                        <i className="ti ti-upload"></i>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>E'lonlarni ommaviy yuklash (Bulk Import)</h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Ko'plab e'lonlarni qo'lda kiritmasdan, fayl orqali bir lahzada yuklang.</p>
                      </div>
                    </div>
                  </div>

                  {/* Simple visual explanation of what fields are needed */}
                  <div className="feed-fields-guide" style={{
                    background: "var(--cream)",
                    padding: "16px",
                    borderRadius: "16px",
                    marginBottom: "20px"
                  }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "600" }}>Quyidagi ma'lumotlar talab qilinadi:</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {[
                        { label: "Sarlavha (title)", desc: "Kvartira nomi" },
                        { label: "Narxi (price)", desc: "USD qiymatda" },
                        { label: "Xonalar (rooms)", desc: "Soni" },
                        { label: "Maydoni (area)", desc: "kv.m" },
                        { label: "Tuman (district)", desc: "Toshkent tumani" },
                        { label: "Telefon (phone)", desc: "Aloqa raqami" }
                      ].map((f, idx) => (
                        <div key={idx} style={{
                          background: "var(--card-bg)",
                          border: "1px solid var(--sand)",
                          padding: "6px 12px",
                          borderRadius: "10px",
                          fontSize: "12px"
                        }}>
                          <strong style={{ color: "var(--orange-dark)" }}>{f.label}</strong>
                          <span style={{ color: "var(--muted)", marginLeft: "4px" }}>({f.desc})</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSchema(!showSchema)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--orange)",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        padding: 0,
                        marginTop: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      {showSchema ? "Namuna formatini yashirish ▴" : "Dasturchilar uchun namuna JSON formatini ko'rish ▾"}
                    </button>

                    {showSchema && (
                      <div className="feed-format-hint" style={{
                        marginTop: "12px",
                        background: "#1e1e1e",
                        color: "#a9b1d6",
                        padding: "16px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        overflowX: "auto",
                        maxHeight: "220px",
                        border: "1px solid #333"
                      }}>
                        <pre style={{ margin: 0 }}>{`[
  {
    "title": "3 xonali kvartira",
    "price": 75000,
    "rooms": 3,
    "baths": 1,
    "area": 78,
    "floor": "5/9",
    "address": "Chilonzor 9-kvartal",
    "district": "Chilonzor",
    "cat": "Yangi uylar",
    "description": "Premium ta'mirlangan.",
    "phone": "+998901234567",
    "photo": "https://..."
  }
]`}</pre>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>JSON formatidagi ma'lumotlar</label>
                    <textarea
                      value={feedJson}
                      onChange={e => setFeedJson(e.target.value)}
                      placeholder="JSON ma'lumotlarini bu yerga nusxalab joylang (paste)..."
                      rows={8}
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "16px",
                        border: "1.5px solid var(--sand)",
                        background: "var(--cream)",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        resize: "vertical",
                        outline: "none",
                        transition: "all 0.2s"
                      }}
                      className="feed-textarea"
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleFeedImport}
                    disabled={loading || !feedJson.trim()}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      padding: "14px",
                      borderRadius: "16px",
                      fontSize: "15px",
                      fontWeight: "700"
                    }}
                  >
                    {loading
                      ? <><i className="ti ti-loader-2 spin"></i> Import qilinmoqda...</>
                      : <><i className="ti ti-upload"></i> Ma'lumotlarni yuklash</>
                    }
                  </button>

                  {feedResult && (
                    <div className="feed-result" style={{
                      marginTop: "16px",
                      background: "var(--green-tint)",
                      color: "#0d7a58",
                      padding: "14px 16px",
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      <i className="ti ti-circle-check-filled" style={{ fontSize: "20px" }}></i>
                      <div>
                        <strong>{feedResult.imported}</strong> ta e'lon muvaffaqiyatli yuklandi.
                        {feedResult.errors > 0 && <span style={{ color: "#c0392b", marginLeft: "8px" }}>({feedResult.errors} ta xato)</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="dashboard-content">
                <div className="settings-card">
                  <h3>Agentlik Ma'lumotlari</h3>
                  <div className="settings-info-grid">
                    <div className="settings-info-item">
                      <label>Nomi</label>
                      <span>{agency.name}</span>
                    </div>
                    <div className="settings-info-item">
                      <label>Slug (URL)</label>
                      <a href={`/agencies/${agency.slug}`} target="_blank">/agencies/{agency.slug}</a>
                    </div>
                    <div className="settings-info-item">
                      <label>Holati</label>
                      <span className={`status-badge ${agency.is_verified ? "active" : "pending"}`}>
                        {agency.is_verified ? "Tasdiqlangan" : "Tasdiqlanmagan"}
                      </span>
                    </div>
                    <div className="settings-info-item">
                      <label>E'lon kvotasi</label>
                      <span>{agencyListings.length} / {agency.listing_quota}</span>
                    </div>
                    <div className="settings-info-item">
                      <label>Telefon</label>
                      <span>{agency.phone || "—"}</span>
                    </div>
                    <div className="settings-info-item">
                      <label>Manzil</label>
                      <span>{agency.address || "—"}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 16 }}>
                    <i className="ti ti-info-circle"></i> Agentlik ma'lumotlarini o'zgartirish uchun admin bilan bog'laning.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
