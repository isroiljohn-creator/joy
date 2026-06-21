"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  erpAddProject,
  erpUpdateProjectProgress,
  erpGetUnits,
  erpAddUnit,
  erpAddLead,
  erpAssignLeadToSeller,
  erpUpdateLeadStatus,
  erpAddMeeting,
  erpUpdateMeetingStatus,
  erpReserveUnit,
  erpAddSale,
  erpRecordPayment,
  erpUpdateUserRole
} from "@/app/erp-actions";

export default function ErpClient({
  user,
  stats: initialStats,
  sellersPerformance: initialSellersPerformance,
  initialProjects,
  initialLeads,
  initialMeetings,
  initialSales,
  sellers,
  allStaff
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(initialStats);
  const [sellersPerformance, setSellersPerformance] = useState(initialSellersPerformance);
  const [projects, setProjects] = useState(initialProjects || []);
  const [selectedProject, setSelectedProject] = useState(initialProjects?.[0] || null);
  const [units, setUnits] = useState([]);
  const [leads, setLeads] = useState(initialLeads || []);
  const [meetings, setMeetings] = useState(initialMeetings || []);
  const [sales, setSales] = useState(initialSales || []);
  const [staff, setStaff] = useState(allStaff || []);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgIsError, setMsgIsError] = useState(false);

  // Modals state
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [selectedUnitForAction, setSelectedUnitForAction] = useState(null);
  const [showContractModal, setShowContractModal] = useState(null); // holds sale object
  
  // Quick booking state
  const [bookingType, setBookingType] = useState("reserve"); // 'reserve' or 'sell'
  const [bookingLeadId, setBookingLeadId] = useState("");
  const [bookingReserveDays, setBookingReserveDays] = useState(3);
  const [bookingPaymentPlan, setBookingPaymentPlan] = useState("cash");
  const [bookingInitialPayment, setBookingInitialPayment] = useState("");
  const [bookingPaidAmount, setBookingPaidAmount] = useState("");
  const [bookingSoldPrice, setBookingSoldPrice] = useState("");

  // Record payment state
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [paymentSaleId, setPaymentSaleId] = useState(null);

  // Forms state
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "", source: "telegram", budget: "", notes: "" });
  const [meetingForm, setMeetingForm] = useState({ lead_id: "", scheduled_time: "", location: "Ofis", notes: "", user_id: "" });
  const [projectForm, setProjectForm] = useState({ name: "", description: "", location: "", budget: "" });
  const [unitForm, setUnitForm] = useState({ unit_number: "", floor: "1", area: "", rooms: "1", price: "" });

  const showToast = (text, isError = false) => {
    setMsg(text);
    setMsgIsError(isError);
    setTimeout(() => {
      setMsg("");
    }, 4000);
  };

  // Auto-fetch units when project changes
  useEffect(() => {
    if (selectedProject) {
      fetchUnits(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchUnits = async (projectId) => {
    const fetched = await erpGetUnits(projectId);
    setUnits(fetched);
  };

  const handleBack = (e) => {
    e.preventDefault();
    router.push("/profile");
  };

  // Form handlers
  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", leadForm.name);
      formData.append("phone", leadForm.phone);
      formData.append("email", leadForm.email);
      formData.append("source", leadForm.source);
      formData.append("budget", leadForm.budget);
      formData.append("notes", leadForm.notes);

      const res = await erpAddLead(formData);
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast("Yangi mijoz muvaffaqiyatli qo'shildi!");
        setShowAddLeadModal(false);
        setLeadForm({ name: "", phone: "", email: "", source: "telegram", budget: "", notes: "" });
        // Refresh leads
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      showToast("Xatolik yuz berdi", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.lead_id || !meetingForm.scheduled_time) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("lead_id", meetingForm.lead_id);
      formData.append("scheduled_time", meetingForm.scheduled_time);
      formData.append("location", meetingForm.location);
      formData.append("notes", meetingForm.notes);
      formData.append("user_id", meetingForm.user_id || user.id);

      const res = await erpAddMeeting(formData);
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast("Uchrashuv muvaffaqiyatli rejalashtirildi!");
        setShowScheduleMeetingModal(false);
        setMeetingForm({ lead_id: "", scheduled_time: "", location: "Ofis", notes: "", user_id: "" });
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      showToast("Xatolik yuz berdi", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", projectForm.name);
      formData.append("description", projectForm.description);
      formData.append("location", projectForm.location);
      formData.append("budget", projectForm.budget);

      const res = await erpAddProject(formData);
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast("Yangi qurilish ob'ekti qo'shildi!");
        setShowAddProjectModal(false);
        setProjectForm({ name: "", description: "", location: "", budget: "" });
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      showToast("Xatolik yuz berdi", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!unitForm.unit_number || !selectedProject) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("project_id", selectedProject.id);
      formData.append("unit_number", unitForm.unit_number);
      formData.append("floor", unitForm.floor);
      formData.append("area", unitForm.area);
      formData.append("rooms", unitForm.rooms);
      formData.append("price", unitForm.price);

      const res = await erpAddUnit(formData);
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast(`Xonadon ${unitForm.unit_number} muvaffaqiyatli qo'shildi!`);
        setShowAddUnitModal(false);
        setUnitForm({ unit_number: "", floor: "1", area: "", rooms: "1", price: "" });
        fetchUnits(selectedProject.id);
        router.refresh();
      }
    } catch {
      showToast("Xatolik yuz berdi", true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId, nextStatus) => {
    try {
      const res = await erpUpdateLeadStatus(leadId, nextStatus);
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast("Mijoz statusi yangilandi.");
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: nextStatus } : l));
        router.refresh();
      }
    } catch {
      showToast("Xatolik yuz berdi", true);
    }
  };

  const handleAssignLead = async (leadId, sellerId) => {
    try {
      const res = await erpAssignLeadToSeller(leadId, sellerId);
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast("Mijoz sotuvchiga biriktirildi!");
        const assignedSeller = sellers.find(s => s.id === parseInt(sellerId));
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assigned_to: parseInt(sellerId), seller_name: assignedSeller?.name || "" } : l));
        router.refresh();
      }
    } catch {
      showToast("Xatolik yuz berdi", true);
    }
  };

  const handleUpdateMeetingStatus = async (meetingId, nextStatus) => {
    try {
      const res = await erpUpdateMeetingStatus(meetingId, nextStatus);
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast("Uchrashuv statusi o'zgartirildi.");
        setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, status: nextStatus } : l));
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      showToast("Xatolik yuz berdi", true);
    }
  };

  // Chessboard booking/sale action
  const handleUnitBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingLeadId || !selectedUnitForAction) return;
    setLoading(true);

    try {
      if (bookingType === "reserve") {
        const expiresAt = new Date(Date.now() + bookingReserveDays * 24 * 60 * 60 * 1000);
        const res = await erpReserveUnit(selectedUnitForAction.id, parseInt(bookingLeadId), expiresAt, user.id);
        if (res.error) {
          showToast(res.error, true);
        } else {
          showToast(`Xonadon ${selectedUnitForAction.unit_number} band qilindi.`);
          setSelectedUnitForAction(null);
          fetchUnits(selectedProject.id);
          router.refresh();
        }
      } else {
        // Sell xonadon
        const formData = new FormData();
        formData.append("unit_id", selectedUnitForAction.id);
        formData.append("lead_id", bookingLeadId);
        formData.append("sold_price", bookingSoldPrice || selectedUnitForAction.price);
        formData.append("payment_plan", bookingPaymentPlan);
        formData.append("initial_payment", bookingInitialPayment || 0);
        formData.append("paid_amount", bookingPaidAmount || bookingInitialPayment || 0);
        formData.append("sold_by", user.id);

        const res = await erpAddSale(formData);
        if (res.error) {
          showToast(res.error, true);
        } else {
          showToast(`Sotuv muvaffaqiyatli rasmiylashtirildi!`);
          setSelectedUnitForAction(null);
          fetchUnits(selectedProject.id);
          router.refresh();
          // Reload page to refresh stats & sales lists
          setTimeout(() => window.location.reload(), 1000);
        }
      }
    } catch (err) {
      showToast("Xatolik yuz berdi: " + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmountInput || !paymentSaleId) return;
    setLoading(true);
    try {
      const res = await erpRecordPayment(paymentSaleId, parseInt(paymentAmountInput));
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast("To'lov muvaffaqiyatli qabul qilindi!");
        setPaymentSaleId(null);
        setPaymentAmountInput("");
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      showToast("Xatolik yuz berdi", true);
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleChange = async (userId, nextRole) => {
    if (!confirm("Foydalanuvchi rolini o'zgartirmoqchimisiz?")) return;
    try {
      const res = await erpUpdateUserRole(userId, nextRole);
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast("Xodim roli muvaffaqiyatli yangilandi!");
        setStaff(prev => prev.map(s => s.id === userId ? { ...s, role: nextRole } : s));
      }
    } catch {
      showToast("Xatolik yuz berdi", true);
    }
  };

  const handleProgressChange = async (projectId, field, val) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    
    const stages = {
      kotlovan: field === 'progress_kotlovan' ? parseInt(val) : proj.progress_kotlovan,
      brick: field === 'progress_brick' ? parseInt(val) : proj.progress_brick,
      facade: field === 'progress_facade' ? parseInt(val) : proj.progress_facade,
      interior: field === 'progress_interior' ? parseInt(val) : proj.progress_interior,
    };

    try {
      const res = await erpUpdateProjectProgress(projectId, stages);
      if (res.error) {
        showToast(res.error, true);
      } else {
        setProjects(prev => prev.map(p => p.id === projectId ? { 
          ...p, 
          progress_kotlovan: stages.kotlovan,
          progress_brick: stages.brick,
          progress_facade: stages.facade,
          progress_interior: stages.interior
        } : p));
        showToast("Loyihaning qurilish progressi yangilandi!");
      }
    } catch {
      showToast("Xatolik yuz berdi", true);
    }
  };

  // Visual helper
  const getSourceLabel = (src) => {
    const srcMap = { telegram: "Telegram", instagram: "Instagram", website: "Vebsayt", recommendation: "Tavsiya", walk_in: "Ofisga kelgan" };
    return srcMap[src] || src;
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      new: "pending",
      contacted: "active",
      meeting_scheduled: "highlight",
      negotiation: "highlight",
      won: "active",
      lost: "inactive"
    };
    return `status-badge ${classMap[status] || "pending"}`;
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      new: "Yangi lid",
      contacted: "Aloqada",
      meeting_scheduled: "Uchrashuv rejalangan",
      negotiation: "Muzokara",
      won: "Sotib oldi",
      lost: "Rad etildi"
    };
    return labelMap[status] || status;
  };

  // Printable contract generator simulation
  const triggerPrintContract = (sale) => {
    setShowContractModal(sale);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Filter leads for dropdowns
  const activeLeads = leads.filter(l => l.status !== "won" && l.status !== "lost");

  return (
    <>
      {/* ───────────────── HEADER ───────────────── */}
      <div className="dashboard-header">
        <div className="wrap">
          <div className="dashboard-header-inner">
            <div className="dashboard-header-left">
              <Link href="/" onClick={handleBack} className="dashboard-back-btn">
                <i className="ti ti-arrow-left"></i> Chiqish
              </Link>
              <div className="dashboard-title-block">
                <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="ti ti-device-analytics" style={{ color: "var(--orange)" }}></i> 
                  ERP Boshqaruv Paneli
                </h1>
                <p className="dashboard-subtitle">
                  Xush kelibsiz, <strong>{stats.userName || user.name}</strong> ({user.role === 'owner' ? 'Kompaniya Xo\'jayini' : user.role === 'rop' ? 'Sotuv Bo\'limi Boshlig\'i' : 'Sotuvchi'})
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddLeadModal(true)} className="btn btn-primary">
                <i className="ti ti-user-plus"></i> Yangi Lid
              </button>
              {(user.role === 'owner' || user.role === 'rop') && (
                <button onClick={() => setShowAddProjectModal(true)} className="btn btn-secondary">
                  <i className="ti ti-plus"></i> Yangi Loyiha
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────── NOTIFICATION TOAST ───────────────── */}
      {msg && (
        <div className={`dashboard-msg ${msgIsError ? "error" : "success"}`} style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 9999,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          animation: "slideDown 0.3s ease"
        }}>
          {msg}
        </div>
      )}

      {/* ───────────────── TABS SECTION ───────────────── */}
      <div className="wrap" style={{ paddingBottom: 80 }}>
        <div className="dashboard-tabs" style={{ marginBottom: 24 }}>
          <button 
            className={`dashboard-tab ${activeTab === "overview" ? "active" : ""}`} 
            onClick={() => setActiveTab("overview")}
          >
            <i className="ti ti-dashboard"></i>
            <span>Bosh sahifa</span>
          </button>
          <button 
            className={`dashboard-tab ${activeTab === "crm" ? "active" : ""}`} 
            onClick={() => setActiveTab("crm")}
          >
            <i className="ti ti-users"></i>
            <span>CRM Lidlar</span>
            {leads.filter(l => l.status === 'new').length > 0 && (
              <span className="tab-badge" style={{ background: "var(--orange)" }}>
                {leads.filter(l => l.status === 'new').length}
              </span>
            )}
          </button>
          <button 
            className={`dashboard-tab ${activeTab === "scheduler" ? "active" : ""}`} 
            onClick={() => setActiveTab("scheduler")}
          >
            <i className="ti ti-calendar"></i>
            <span>Uchrashuvlar</span>
            {meetings.filter(m => m.status === 'scheduled').length > 0 && (
              <span className="tab-badge" style={{ background: "var(--purple)" }}>
                {meetings.filter(m => m.status === 'scheduled').length}
              </span>
            )}
          </button>
          <button 
            className={`dashboard-tab ${activeTab === "projects" ? "active" : ""}`} 
            onClick={() => setActiveTab("projects")}
          >
            <i className="ti ti-building-skyscraper"></i>
            <span>Loyihalar va Shaxmatka</span>
          </button>
          <button 
            className={`dashboard-tab ${activeTab === "sales" ? "active" : ""}`} 
            onClick={() => setActiveTab("sales")}
          >
            <i className="ti ti-cash"></i>
            <span>Sotuvlar</span>
          </button>
          {user.role === 'owner' && (
            <button 
              className={`dashboard-tab ${activeTab === "staff" ? "active" : ""}`} 
              onClick={() => setActiveTab("staff")}
            >
              <i className="ti ti-shield"></i>
              <span>Xodimlar</span>
            </button>
          )}
        </div>

        {/* ───────────────── OVERVIEW TAB ───────────────── */}
        {activeTab === "overview" && (
          <div className="dashboard-content" style={{ animation: "fadeIn 0.2s ease" }}>
            
            {/* Stat Cards */}
            <div className="dashboard-stats-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 32
            }}>
              <div className="dashboard-stat-card">
                <i className="ti ti-cash"></i>
                <div className="stat-value" style={{ fontSize: 20 }}>
                  ${stats.totalSalesVolume?.toLocaleString()}
                </div>
                <div className="stat-label">Jami Shartnomalar</div>
              </div>
              <div className="dashboard-stat-card highlight">
                <i className="ti ti-square-rounded-check" style={{ color: "var(--green)" }}></i>
                <div className="stat-value" style={{ fontSize: 20 }}>
                  ${stats.totalCashIn?.toLocaleString()}
                </div>
                <div className="stat-label">Tushgan Pul (Kassa)</div>
              </div>
              <div className="dashboard-stat-card">
                <i className="ti ti-alert-circle"></i>
                <div className="stat-value" style={{ fontSize: 20, color: "var(--orange-dark)" }}>
                  ${stats.totalOutstanding?.toLocaleString()}
                </div>
                <div className="stat-label">Kutilayotgan Pul (Nasiya)</div>
              </div>
              <div className="dashboard-stat-card">
                <i className="ti ti-users"></i>
                <div className="stat-value">{stats.totalLeads}</div>
                <div className="stat-label">Jami Lidlar ({stats.newLeads} ta yangi)</div>
              </div>
              <div className="dashboard-stat-card">
                <i className="ti ti-calendar-event"></i>
                <div className="stat-value">{stats.scheduledMeetings}</div>
                <div className="stat-label">Uchrashuvlar</div>
              </div>
            </div>

            {/* Financial and Leaderboard Split View (Owner & ROP) */}
            <div style={{
              display: "grid",
              gridTemplateColumns: (user.role === 'owner' || user.role === 'rop') ? "repeat(auto-fit, minmax(400px, 1fr))" : "1fr",
              gap: 24,
              marginBottom: 32
            }}>
              
              {/* Left Side: Apartment status and quick info */}
              <div style={{
                background: "var(--card-bg)",
                border: "1px solid var(--sand)",
                borderRadius: 24,
                padding: 24
              }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700 }}>Xonadonlar Holati Analitikasi</h3>
                
                {/* CSS Based Progress bar representation of inventory */}
                <div className="progress-track" style={{
                  height: 24,
                  background: "#eee",
                  borderRadius: 12,
                  display: "flex",
                  overflow: "hidden",
                  marginBottom: 20
                }}>
                  {stats.totalUnits > 0 ? (
                    <>
                      <div style={{ 
                        width: `${(stats.soldUnits / stats.totalUnits) * 100}%`, 
                        background: "#ef4444", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        color: "#fff", 
                        fontSize: 10,
                        fontWeight: 700
                      }} title={`Sotilgan: ${stats.soldUnits}`}>
                        {Math.round((stats.soldUnits / stats.totalUnits) * 100)}%
                      </div>
                      <div style={{ 
                        width: `${(stats.reservedUnits / stats.totalUnits) * 100}%`, 
                        background: "#f59e0b", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        color: "#fff", 
                        fontSize: 10,
                        fontWeight: 700
                      }} title={`Bron: ${stats.reservedUnits}`}>
                        {Math.round((stats.reservedUnits / stats.totalUnits) * 100)}%
                      </div>
                      <div style={{ 
                        width: `${(stats.availableUnits / stats.totalUnits) * 100}%`, 
                        background: "#22c55e", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        color: "#fff", 
                        fontSize: 10,
                        fontWeight: 700
                      }} title={`Bo'sh: ${stats.availableUnits}`}>
                        {Math.round((stats.availableUnits / stats.totalUnits) * 100)}%
                      </div>
                    </>
                  ) : (
                    <div style={{ width: "100%", textAlign: "center", fontSize: 12, color: "#999", lineHeight: "24px" }}>
                      Ma'lumotlar mavjud emas
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#22c55e", marginRight: 6 }}></div>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>Bo'sh: <strong>{stats.availableUnits} ta</strong></span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#f59e0b", marginRight: 6 }}></div>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>Bron: <strong>{stats.reservedUnits} ta</strong></span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: "#ef4444", marginRight: 6 }}></div>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>Sotilgan: <strong>{stats.soldUnits} ta</strong></span>
                  </div>
                </div>

                <div style={{
                  borderTop: "1px solid var(--sand)",
                  marginTop: 20,
                  paddingTop: 16,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12
                }}>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Jami Xonadonlar:</span>
                    <h4 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{stats.totalUnits} ta</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>Sotuv ulushi:</span>
                    <h4 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--orange-dark)" }}>
                      {stats.totalUnits > 0 ? Math.round((stats.soldUnits / stats.totalUnits) * 100) : 0}%
                    </h4>
                  </div>
                </div>
              </div>

              {/* Right Side: Seller Performance KPI (Owner/ROP only) */}
              {(user.role === 'owner' || user.role === 'rop') && (
                <div style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--sand)",
                  borderRadius: 24,
                  padding: 24
                }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700 }}>Sotuvchilar Reytingi (KPI)</h3>
                  {sellersPerformance.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--muted)", padding: "20px 0" }}>
                      Sotuvchilar mavjud emas
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {sellersPerformance.map(s => (
                        <div key={s.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                            <span><strong>{s.name}</strong> ({s.sales_count} ta shartnoma)</span>
                            <strong>${s.sales_volume?.toLocaleString()}</strong>
                          </div>
                          <div className="progress-track" style={{ height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              background: "var(--orange)",
                              width: `${stats.totalSalesVolume > 0 ? (s.sales_volume / stats.totalSalesVolume) * 100 : 0}%`
                            }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upcoming/Today's meetings */}
            <div style={{
              background: "var(--card-bg)",
              border: "1px solid var(--sand)",
              borderRadius: 24,
              padding: 24
            }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700 }}>Kelgusi Uchrashuvlar</h3>
              {meetings.filter(m => m.status === 'scheduled').length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--muted)", padding: "30px 0" }}>
                  <i className="ti ti-calendar-off" style={{ fontSize: 32, display: "block", marginBottom: 8 }}></i>
                  Rejalashtirilgan uchrashuvlar yo'q
                </div>
              ) : (
                <div className="dashboard-listings-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Mijoz</th>
                        <th>Vaqt</th>
                        <th>Joylashuv</th>
                        <th>Mas'ul</th>
                        <th>Izoh</th>
                        <th>Harakatlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meetings.filter(m => m.status === 'scheduled').slice(0, 5).map(m => (
                        <tr key={m.id}>
                          <td>
                            <strong>{m.lead_name}</strong>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.lead_phone}</div>
                          </td>
                          <td>
                            <strong>{new Date(m.scheduled_time).toLocaleDateString("uz-UZ")}</strong>
                            <div style={{ fontSize: 11 }}>{new Date(m.scheduled_time).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td>{m.location}</td>
                          <td>{m.seller_name || "—"}</td>
                          <td style={{ fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{m.notes || "—"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button 
                                onClick={() => handleUpdateMeetingStatus(m.id, 'completed')} 
                                className="btn btn-secondary" 
                                style={{ padding: "4px 8px", fontSize: 11, background: "var(--green-tint)", color: "#16a34a", border: "none" }}
                              >
                                ✓ Yakunlandi
                              </button>
                              <button 
                                onClick={() => handleUpdateMeetingStatus(m.id, 'cancelled')} 
                                className="btn btn-secondary" 
                                style={{ padding: "4px 8px", fontSize: 11, background: "#fde8e8", color: "#dc2626", border: "none" }}
                              >
                                ✕ Bekor
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ───────────────── CRM TAB (KANBAN BOARD) ───────────────── */}
        {activeTab === "crm" && (
          <div className="dashboard-content" style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Mijozlar Kanban Doskasi (Sales Pipeline)</h3>
              <button onClick={() => setShowAddLeadModal(true)} className="btn btn-primary">
                <i className="ti ti-plus"></i> Yangi Mijoz
              </button>
            </div>

            {/* Kanban Columns container */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
              overflowX: "auto",
              paddingBottom: 20
            }}>
              {["new", "contacted", "meeting_scheduled", "negotiation", "won", "lost"].map(status => {
                const columnLeads = leads.filter(l => l.status === status);
                return (
                  <div key={status} style={{
                    background: "var(--cream)",
                    borderRadius: 20,
                    padding: 12,
                    minHeight: 500,
                    border: "1px solid var(--sand)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 6px" }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: "capitalize", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: "50%", 
                          background: status === 'won' ? '#22c55e' : status === 'lost' ? '#ef4444' : status === 'new' ? '#6366f1' : '#f59e0b'
                        }}></span>
                        {getStatusLabel(status)}
                      </h4>
                      <span className="kanban-badge" style={{
                        background: "#fff",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--muted)"
                      }}>{columnLeads.length}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {columnLeads.map(l => (
                        <div key={l.id} className="kanban-card" style={{
                          background: "#fff",
                          borderRadius: 14,
                          padding: 12,
                          border: "1px solid var(--sand)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                          position: "relative"
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{l.name}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                            <i className="ti ti-phone" style={{ marginRight: 4 }}></i> {l.phone}
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                            <span style={{
                              background: "var(--orange-tint)",
                              color: "var(--orange-dark)",
                              fontSize: 10,
                              padding: "2px 6px",
                              borderRadius: 6,
                              fontWeight: 600
                            }}>{getSourceLabel(l.source)}</span>
                            
                            {l.budget > 0 && (
                              <span style={{
                                background: "var(--green-tint)",
                                color: "#16a34a",
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 6,
                                fontWeight: 600
                              }}>${parseInt(l.budget).toLocaleString()}</span>
                            )}
                          </div>

                          <div className="kanban-card-notes" style={{ fontSize: 12, color: "#666", background: "#f9f9f9", padding: 6, borderRadius: 8, marginBottom: 12, fontStyle: "italic" }}>
                            {l.notes || "Izoh kiritilmagan"}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
                            {/* ROP/Owner assignment */}
                            {(user.role === 'rop' || user.role === 'owner') ? (
                              <select
                                value={l.assigned_to || ""}
                                onChange={(e) => handleAssignLead(l.id, e.target.value)}
                                style={{ fontSize: 11, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 8, maxWidth: 120 }}
                              >
                                <option value="">Biriktirish...</option>
                                {sellers.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                <i className="ti ti-user"></i> {l.seller_name || "Biriktirilmagan"}
                              </span>
                            )}

                            {/* Dropdown to change status */}
                            <select
                              value={l.status}
                              onChange={(e) => handleUpdateLeadStatus(l.id, e.target.value)}
                              style={{ fontSize: 11, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 8 }}
                            >
                              <option value="new">Yangi lid</option>
                              <option value="contacted">Aloqada</option>
                              <option value="meeting_scheduled">Uchrashuv</option>
                              <option value="negotiation">Muzokara</option>
                              <option value="won">Sotib oldi</option>
                              <option value="lost">Rad etildi</option>
                            </select>
                          </div>

                          {/* Quick button to schedule meeting */}
                          {l.status !== 'won' && l.status !== 'lost' && (
                            <button
                              onClick={() => {
                                setMeetingForm(p => ({ ...p, lead_id: l.id }));
                                setShowScheduleMeetingModal(true);
                              }}
                              style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                background: "none",
                                border: "none",
                                color: "var(--purple)",
                                cursor: "pointer"
                              }}
                              title="Uchrashuv rejalashtirish"
                            >
                              <i className="ti ti-calendar-plus" style={{ fontSize: 16 }}></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ───────────────── SCHEDULER TAB ───────────────── */}
        {activeTab === "scheduler" && (
          <div className="dashboard-content" style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Uchrashuvlar va Taqvim</h3>
              <button onClick={() => setShowScheduleMeetingModal(true)} className="btn btn-primary">
                <i className="ti ti-calendar-plus"></i> Uchrashuv belgilash
              </button>
            </div>

            {/* Meetings Table */}
            {meetings.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: "50px 0" }}>
                Hali uchrashuvlar belgilanmagan.
              </div>
            ) : (
              <div className="dashboard-listings-table">
                <table>
                  <thead>
                    <tr>
                      <th>Sana va Vaqt</th>
                      <th>Mijoz</th>
                      <th>Joylashuv</th>
                      <th>Mavzu/Izoh</th>
                      <th>Mas'ul</th>
                      <th>Status</th>
                      <th>Harakatlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.map(m => (
                      <tr key={m.id} style={{ opacity: m.status === 'cancelled' ? 0.6 : 1 }}>
                        <td>
                          <strong>{new Date(m.scheduled_time).toLocaleDateString("uz-UZ")}</strong>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>
                            {new Date(m.scheduled_time).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <strong>{m.lead_name}</strong>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.lead_phone}</div>
                        </td>
                        <td>{m.location}</td>
                        <td style={{ fontSize: 12, maxWidth: 250 }}>{m.notes || "—"}</td>
                        <td>{m.seller_name || "—"}</td>
                        <td>
                          <span className={`status-badge ${m.status === 'completed' ? 'active' : m.status === 'cancelled' ? 'inactive' : 'pending'}`}>
                            {m.status === 'completed' ? 'Yakunlandi' : m.status === 'cancelled' ? 'Bekor qilindi' : 'Kutilmoqda'}
                          </span>
                        </td>
                        <td>
                          {m.status === 'scheduled' && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button 
                                onClick={() => handleUpdateMeetingStatus(m.id, 'completed')} 
                                className="btn btn-secondary" 
                                style={{ padding: "4px 8px", fontSize: 11, background: "var(--green-tint)", color: "#16a34a", border: "none" }}
                              >
                                Yakunlandi
                              </button>
                              <button 
                                onClick={() => handleUpdateMeetingStatus(m.id, 'cancelled')} 
                                className="btn btn-secondary" 
                                style={{ padding: "4px 8px", fontSize: 11, background: "#fde8e8", color: "#dc2626", border: "none" }}
                              >
                                Bekor qilish
                              </button>
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

        {/* ───────────────── PROJECTS & SHAXMATKA TAB ───────────────── */}
        {activeTab === "projects" && (
          <div className="dashboard-content" style={{ animation: "fadeIn 0.2s ease" }}>
            
            {/* Project selection grid/cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
              {projects.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedProject(p)}
                  style={{
                    background: "var(--card-bg)",
                    border: selectedProject?.id === p.id ? "2px solid var(--orange)" : "1px solid var(--sand)",
                    borderRadius: 20,
                    padding: 16,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <h4 style={{ margin: "0 0 6px 0", fontSize: 15, fontWeight: 700 }}>{p.name}</h4>
                  <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "var(--muted)" }}>{p.location}</p>
                  
                  {/* Construction progress summary */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
                      <span>Progress (G'isht/Karkas):</span>
                      <strong>{p.progress_brick}%</strong>
                    </div>
                    <div className="progress-track" style={{ height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "var(--orange)", width: `${p.progress_brick}%` }}></div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 12, color: "var(--muted)" }}>
                    <span>Xonadonlar: <strong>{p.total_units} ta</strong></span>
                    <span>Sotilgan: <strong style={{ color: "#ef4444" }}>{p.sold_units} ta</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Project Interactive Details */}
            {selectedProject && (
              <div style={{
                background: "var(--card-bg)",
                border: "1px solid var(--sand)",
                borderRadius: 24,
                padding: 24
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 24, borderBottom: "1px solid var(--sand)", paddingBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedProject.name} — Visual Shaxmatka</h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--muted)" }}>{selectedProject.description}</p>
                  </div>
                  
                  <div style={{ display: "flex", gap: 8 }}>
                    {(user.role === 'owner' || user.role === 'rop') && (
                      <button onClick={() => setShowAddUnitModal(true)} className="btn btn-secondary">
                        <i className="ti ti-plus"></i> Xonadon Qo'shish
                      </button>
                    )}
                  </div>
                </div>

                {/* Editable Construction Progress for ROP/Owner */}
                {(user.role === 'owner' || user.role === 'rop') && (
                  <div style={{
                    background: "var(--cream)",
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 24
                  }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 700 }}>Qurilish Progressini Tahrirlash:</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                      {[
                        { key: "progress_kotlovan", label: "Kotlovan/Poydevor" },
                        { key: "progress_brick", label: "G'isht terish" },
                        { key: "progress_facade", label: "Tashqi fasad" },
                        { key: "progress_interior", label: "Ichki ishlar/Pardoz" }
                      ].map(stage => (
                        <div key={stage.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontSize: 11, color: "var(--muted)" }}>{stage.label}:</label>
                          <select
                            value={selectedProject[stage.key]}
                            onChange={(e) => handleProgressChange(selectedProject.id, stage.key, e.target.value)}
                            style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 8, fontSize: 12 }}
                          >
                            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(pct => (
                              <option key={pct} value={pct}>{pct}%</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shaxmatka Grid Display */}
                {units.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                    Ushbu loyihada hali xonadonlar yaratilmagan.
                  </div>
                ) : (
                  <div>
                    {/* Grid Legend */}
                    <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 20 }}>
                      <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 4, background: "#22c55e", display: "inline-block" }}></span> Bo'sh (Available)
                      </span>
                      <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 4, background: "#f59e0b", display: "inline-block" }}></span> Bron qilingan (Reserved)
                      </span>
                      <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 4, background: "#ef4444", display: "inline-block" }}></span> Sotilgan (Sold)
                      </span>
                    </div>

                    {/* Group units by floor to render row-by-row */}
                    {Object.entries(
                      units.reduce((acc, unit) => {
                        const floor = unit.floor;
                        if (!acc[floor]) acc[floor] = [];
                        acc[floor].push(unit);
                        return acc;
                      }, {})
                    )
                    .sort((a, b) => parseInt(b[0]) - parseInt(a[0])) // Sort floors in descending order
                    .map(([floor, floorUnits]) => (
                      <div key={floor} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        {/* Floor Label */}
                        <div style={{
                          width: 44,
                          height: 44,
                          background: "var(--cream)",
                          border: "1px solid var(--sand)",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700
                        }}>{floor}-qavat</div>

                        {/* Apartments grid */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {floorUnits.sort((a,b) => a.unit_number.localeCompare(b.unit_number)).map(u => {
                            const isReserved = u.status === 'reserved';
                            const isSold = u.status === 'sold';
                            const isAvailable = u.status === 'available';

                            let bg = "#22c55e"; // green
                            if (isReserved) bg = "#f59e0b";
                            if (isSold) bg = "#ef4444";

                            return (
                              <div
                                key={u.id}
                                onClick={() => {
                                  setSelectedUnitForAction(u);
                                  setBookingSoldPrice(u.price);
                                }}
                                style={{
                                  width: 64,
                                  height: 48,
                                  background: bg,
                                  color: "#fff",
                                  borderRadius: 8,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  position: "relative",
                                  transition: "all 0.1s",
                                  border: "2.5px solid transparent",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                                }}
                                className="unit-grid-cell"
                                title={`Xonadon ${u.unit_number}, ${u.rooms} xona, ${u.area} m²`}
                              >
                                <span style={{ fontWeight: 700, fontSize: 13 }}>{u.unit_number}</span>
                                <span style={{ fontSize: 9, opacity: 0.8 }}>{u.rooms} x / {Math.round(u.area)}m²</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ───────────────── SALES & FINANCIALS TAB ───────────────── */}
        {activeTab === "sales" && (
          <div className="dashboard-content" style={{ animation: "fadeIn 0.2s ease" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 700 }}>Rasmiylashtirilgan Shartnomalar</h3>
            {sales.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: "50px 0" }}>
                Hali sotuv shartnomalari rasmiylashtirilmagan.
              </div>
            ) : (
              <div className="dashboard-listings-table">
                <table>
                  <thead>
                    <tr>
                      <th>Loyiha / Xonadon</th>
                      <th>Xaridor</th>
                      <th>Sotilgan narxi</th>
                      <th>To'lov turi</th>
                      <th>To'lov progressi</th>
                      <th>Sana</th>
                      <th>Sotuvchi</th>
                      <th>Shartnoma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(s => {
                      const outstanding = parseInt(s.sold_price) - parseInt(s.paid_amount);
                      const percentPaid = Math.round((parseInt(s.paid_amount) / parseInt(s.sold_price)) * 100);
                      return (
                        <tr key={s.id}>
                          <td>
                            <strong>{s.project_name}</strong>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.unit_number}-xonadon · {s.rooms} xona · {s.area} m²</div>
                          </td>
                          <td>
                            <strong>{s.lead_name}</strong>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.lead_phone}</div>
                          </td>
                          <td><strong>${parseInt(s.sold_price).toLocaleString()}</strong></td>
                          <td>
                            <span style={{ textTransform: "capitalize", fontSize: 12 }}>
                              {s.payment_plan === 'cash' ? 'Naqd' : s.payment_plan === 'installments' ? 'Nasiya' : 'Ipoteka'}
                            </span>
                          </td>
                          <td>
                            <div style={{ width: 140 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)" }}>
                                <span>{percentPaid}% to'landi</span>
                                {outstanding > 0 && <span style={{ color: "var(--orange-dark)" }}>Qarz: ${outstanding.toLocaleString()}</span>}
                              </div>
                              <div className="progress-track" style={{ height: 6, background: "#eee", borderRadius: 3, overflow: "hidden", marginTop: 2 }}>
                                <div style={{ height: "100%", background: outstanding === 0 ? "#22c55e" : "var(--orange)", width: `${percentPaid}%` }}></div>
                              </div>
                              
                              {/* Add payment action button for Owner/ROP */}
                              {(user.role === 'owner' || user.role === 'rop') && outstanding > 0 && (
                                <button
                                  onClick={() => {
                                    setPaymentSaleId(s.id);
                                    setPaymentAmountInput("");
                                  }}
                                  style={{
                                    border: "none",
                                    background: "none",
                                    color: "var(--orange)",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    padding: 0,
                                    marginTop: 4,
                                    display: "block"
                                  }}
                                >
                                  + To'lov Qabul Qilish
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ fontSize: 12, opacity: 0.7 }}>
                            {new Date(s.sold_at).toLocaleDateString("uz-UZ")}
                          </td>
                          <td>{s.seller_name || "—"}</td>
                          <td>
                            <button
                              onClick={() => triggerPrintContract(s)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: 11 }}
                            >
                              <i className="ti ti-printer"></i> Chop etish
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ───────────────── STAFF MANAGEMENT TAB (OWNER ONLY) ───────────────── */}
        {activeTab === "staff" && user.role === "owner" && (
          <div className="dashboard-content" style={{ animation: "fadeIn 0.2s ease" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 700 }}>Xodimlar va Ruxsatlarni Boshqarish</h3>
            
            <div className="dashboard-listings-table">
              <table>
                <thead>
                  <tr>
                    <th>Xodim Ismi</th>
                    <th>Telefon Raqami</th>
                    <th>Joriy Rol</th>
                    <th>Yaratilgan sana</th>
                    <th>Rolini o'zgartirish</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(member => (
                    <tr key={member.id}>
                      <td><strong>{member.name}</strong> {member.id === user.id && <span style={{ fontSize: 10, color: "var(--orange)" }}>(Siz)</span>}</td>
                      <td>{member.phone}</td>
                      <td>
                        <span className={`status-badge ${member.role === 'owner' ? 'active' : member.role === 'rop' ? 'highlight' : 'pending'}`}>
                          {member.role === 'owner' ? 'Kompaniya Xo\'jayini' : member.role === 'rop' ? 'ROP (Boshliq)' : 'Sotuvchi (Agent)'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, opacity: 0.7 }}>
                        {new Date(member.created_at).toLocaleDateString("uz-UZ")}
                      </td>
                      <td>
                        {member.id !== user.id ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleUserRoleChange(member.id, e.target.value)}
                            style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #ddd", borderRadius: 8 }}
                          >
                            <option value="seller">Sotuvchi</option>
                            <option value="rop">ROP</option>
                            <option value="owner">Owner (Xo'jayin)</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────── MODAL: SCHEDULING BOOKING / SALE (CHESSGRID DETAILS) ───────────────── */}
      {selectedUnitForAction && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }} onClick={() => setSelectedUnitForAction(null)}>
          <div className="create-agency-card" style={{
            width: "100%",
            maxWidth: 500,
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            animation: "slideUp 0.2s ease"
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--sand)", paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Xonadon #{selectedUnitForAction.unit_number} (Bino visual tafsilotlari)
              </h3>
              <button onClick={() => setSelectedUnitForAction(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, background: "var(--cream)", padding: 14, borderRadius: 16, marginBottom: 16 }}>
              <div>Qavat: <strong>{selectedUnitForAction.floor}-qavat</strong></div>
              <div>Xonalar soni: <strong>{selectedUnitForAction.rooms} xona</strong></div>
              <div>Umumiy maydon: <strong>{selectedUnitForAction.area} m²</strong></div>
              <div>Boshlang'ich narxi: <strong style={{ color: "var(--orange-dark)" }}>${parseInt(selectedUnitForAction.price).toLocaleString()}</strong></div>
              <div style={{ gridColumn: "span 2" }}>Xolat: <strong style={{ textTransform: "uppercase" }}>{selectedUnitForAction.status === 'available' ? 'Bo\'sh (Sotuvda)' : selectedUnitForAction.status === 'reserved' ? 'Band qilingan' : 'Sotilgan'}</strong></div>
              {selectedUnitForAction.status === 'reserved' && (
                <div style={{ gridColumn: "span 2", fontSize: 12, color: "var(--orange-dark)", marginTop: 4 }}>
                  📌 Bron muddati: {new Date(selectedUnitForAction.reserved_until).toLocaleDateString("uz-UZ")} gacha ({selectedUnitForAction.seller_name} tomonidan)
                </div>
              )}
            </div>

            {/* If Available: allow reserving or selling */}
            {selectedUnitForAction.status === 'available' && (
              <form onSubmit={handleUnitBookingSubmit}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12 }}>Harakat turi:</label>
                  <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input type="radio" value="reserve" checked={bookingType === "reserve"} onChange={() => setBookingType("reserve")} />
                      Bron qilish (Rezerv)
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input type="radio" value="sell" checked={bookingType === "sell"} onChange={() => setBookingType("sell")} />
                      Sotuvni rasmiylashtirish
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12 }}>Xaridor (Mijoz) *</label>
                  <select
                    value={bookingLeadId}
                    onChange={(e) => setBookingLeadId(e.target.value)}
                    required
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                  >
                    <option value="">Mijozni tanlang...</option>
                    {activeLeads.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.phone})</option>
                    ))}
                  </select>
                </div>

                {bookingType === "reserve" ? (
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12 }}>Bron muddati (kunlarda) *</label>
                    <select
                      value={bookingReserveDays}
                      onChange={(e) => setBookingReserveDays(parseInt(e.target.value))}
                      style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                    >
                      <option value="1">1 kun</option>
                      <option value="3">3 kun</option>
                      <option value="5">5 kun</option>
                      <option value="7">7 kun (1 hafta)</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12 }}>Sotish narxi ($) *</label>
                      <input
                        type="number"
                        value={bookingSoldPrice}
                        onChange={(e) => setBookingSoldPrice(e.target.value)}
                        placeholder={selectedUnitForAction.price}
                        required
                        style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                      />
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <div className="form-group">
                        <label style={{ fontSize: 12 }}>To'lov turi</label>
                        <select
                          value={bookingPaymentPlan}
                          onChange={(e) => setBookingPaymentPlan(e.target.value)}
                          style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                        >
                          <option value="cash">Naqd to'liq</option>
                          <option value="installments">Bo'lib to'lash (Nasiya)</option>
                          <option value="mortgage">Ipoteka krediti</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: 12 }}>Boshlang'ich to'lov ($)</label>
                        <input
                          type="number"
                          value={bookingInitialPayment}
                          onChange={(e) => setBookingInitialPayment(e.target.value)}
                          placeholder="0"
                          style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12 }}>Xozirda to'lanayotgan summa ($)</label>
                      <input
                        type="number"
                        value={bookingPaidAmount}
                        onChange={(e) => setBookingPaidAmount(e.target.value)}
                        placeholder="0"
                        style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                      />
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? "Jarayonda..." : bookingType === "reserve" ? "Bron qilishni tasdiqlash" : "Sotuvni yakunlash"}
                </button>
              </form>
            )}

            {/* If Reserved: allow converting to sale or freeing */}
            {selectedUnitForAction.status === 'reserved' && (
              <div>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Ushbu xonadon hozirda band qilingan. Uni to'g'ridan-to'g'ri sotib yuborishingiz yoki bronni bekor qilishingiz mumkin.</p>
                
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button
                    onClick={() => {
                      setBookingType("sell");
                      // Prefill lead ID from reservation if possible, or let them choose
                      setBookingLeadId("");
                      setBookingSoldPrice(selectedUnitForAction.price);
                      // Change status locally to available to trigger form below
                      setSelectedUnitForAction(prev => ({ ...prev, status: 'available' }));
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Shartnoma tuzish
                  </button>
                  
                  {/* cancel reservation */}
                  <button
                    onClick={async () => {
                      if (!confirm("Bronni bekor qilmoqchimisiz?")) return;
                      setLoading(true);
                      try {
                        const res = await erpReserveUnit(selectedUnitForAction.id, null, null, null); // clearing by passing nulls
                        if (res.error) {
                          showToast(res.error, true);
                        } else {
                          showToast("Bron muvaffaqiyatli bekor qilindi.");
                          setSelectedUnitForAction(null);
                          fetchUnits(selectedProject.id);
                          router.refresh();
                        }
                      } catch {
                        showToast("Xatolik yuz berdi", true);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, background: "#fde8e8", color: "#dc2626", borderColor: "#fde8e8" }}
                    disabled={loading}
                  >
                    Bronni Bekor Qilish
                  </button>
                </div>
              </div>
            )}

            {/* If Sold: show payment record option */}
            {selectedUnitForAction.status === 'sold' && (
              <div>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Ushbu xonadon sotilgan. Loyihani moliya bo'limida ko'rishingiz yoki shartnoma bo'yicha to'lov kiritishingiz mumkin.</p>
                <button
                  onClick={() => setSelectedUnitForAction(null)}
                  className="btn btn-secondary btn-full"
                >
                  Yopish
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ───────────────── MODAL: TO'LOV QABUL QILISH ───────────────── */}
      {paymentSaleId && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }} onClick={() => setPaymentSaleId(null)}>
          <div className="create-agency-card" style={{
            width: "100%",
            maxWidth: 400,
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            animation: "slideUp 0.2s ease"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--sand)", paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>To'lov Qabul Qilish</h3>
              <button onClick={() => setPaymentSaleId(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>✕</button>
            </div>
            
            <form onSubmit={handleRecordPaymentSubmit}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12 }}>Kiritilgan to'lov summasi ($) *</label>
                <input
                  type="number"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  placeholder="To'lov summasini kiriting..."
                  required
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Saqlanmoqda..." : "To'lovni Tasdiqlash"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: ADD LEAD ───────────────── */}
      {showAddLeadModal && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }} onClick={() => setShowAddLeadModal(false)}>
          <div className="create-agency-card" style={{
            width: "100%",
            maxWidth: 450,
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            animation: "slideUp 0.2s ease"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--sand)", paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Yangi Mijoz Qo'shish (CRM Lead)</h3>
              <button onClick={() => setShowAddLeadModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>✕</button>
            </div>
            
            <form onSubmit={handleAddLead}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Ism-Familiya *</label>
                <input
                  type="text"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Mijoz ismi..."
                  required
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div className="form-group">
                  <label style={{ fontSize: 12 }}>Telefon *</label>
                  <input
                    type="text"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+998 90 123 45 67"
                    required
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 12 }}>Email</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com"
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div className="form-group">
                  <label style={{ fontSize: 12 }}>Manba</label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm(p => ({ ...p, source: e.target.value }))}
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                  >
                    <option value="telegram">Telegram</option>
                    <option value="instagram">Instagram</option>
                    <option value="website">Vebsayt</option>
                    <option value="recommendation">Tavsiya</option>
                    <option value="walk_in">Ofisga kelgan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 12 }}>Byudjet ($)</label>
                  <input
                    type="number"
                    value={leadForm.budget}
                    onChange={(e) => setLeadForm(p => ({ ...p, budget: e.target.value }))}
                    placeholder="50000"
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12 }}>Qo'shimcha izoh</label>
                <textarea
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Kvartira talablari va boshqalar..."
                  rows={3}
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4, resize: "none" }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Saqlanmoqda..." : "Mijozni Saqlash"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: SCHEDULE MEETING ───────────────── */}
      {showScheduleMeetingModal && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }} onClick={() => setShowScheduleMeetingModal(false)}>
          <div className="create-agency-card" style={{
            width: "100%",
            maxWidth: 450,
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            animation: "slideUp 0.2s ease"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--sand)", paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Uchrashuv Rejalashtirish</h3>
              <button onClick={() => setShowScheduleMeetingModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>✕</button>
            </div>
            
            <form onSubmit={handleAddMeeting}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Mijoz (Lid) *</label>
                <select
                  value={meetingForm.lead_id}
                  onChange={(e) => setMeetingForm(p => ({ ...p, lead_id: e.target.value }))}
                  required
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                >
                  <option value="">Mijozni tanlang...</option>
                  {activeLeads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.phone})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Uchrashuv vaqti *</label>
                <input
                  type="datetime-local"
                  value={meetingForm.scheduled_time}
                  onChange={(e) => setMeetingForm(p => ({ ...p, scheduled_time: e.target.value }))}
                  required
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Uchrashuv joyi</label>
                <input
                  type="text"
                  value={meetingForm.location}
                  onChange={(e) => setMeetingForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="Ofis, Olmazor city ob'ekti va hk..."
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                />
              </div>

              {user.role !== 'seller' && (
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12 }}>Mas'ul sotuvchi</label>
                  <select
                    value={meetingForm.user_id}
                    onChange={(e) => setMeetingForm(p => ({ ...p, user_id: e.target.value }))}
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                  >
                    <option value="">O'zim (yoki tanlang)</option>
                    {sellers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12 }}>Mavzu / Maqsad</label>
                <textarea
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Uy taqdimoti, shartnoma shartlari muhokamasi..."
                  rows={2}
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4, resize: "none" }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Saqlanmoqda..." : "Uchrashuvni Rejalashtirish"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: ADD PROJECT ───────────────── */}
      {showAddProjectModal && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }} onClick={() => setShowAddProjectModal(false)}>
          <div className="create-agency-card" style={{
            width: "100%",
            maxWidth: 450,
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            animation: "slideUp 0.2s ease"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--sand)", paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Yangi Qurilish Loyihasi</h3>
              <button onClick={() => setShowAddProjectModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>✕</button>
            </div>
            
            <form onSubmit={handleAddProject}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Loyiha Nomi *</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Masalan: Olmazor City B-4"
                  required
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Manzil</label>
                <input
                  type="text"
                  value={projectForm.location}
                  onChange={(e) => setProjectForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="Manzili..."
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Loyiha Byudjeti ($)</label>
                <input
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm(p => ({ ...p, budget: e.target.value }))}
                  placeholder="1000000"
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12 }}>Tavsif</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Loyiha haqida qisqacha ma'lumot..."
                  rows={2}
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4, resize: "none" }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Saqlanmoqda..." : "Loyihani Saqlash"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: ADD UNIT ───────────────── */}
      {showAddUnitModal && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }} onClick={() => setShowAddUnitModal(false)}>
          <div className="create-agency-card" style={{
            width: "100%",
            maxWidth: 450,
            background: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            animation: "slideUp 0.2s ease"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--sand)", paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Yangi Xonadon Qo'shish</h3>
              <button onClick={() => setShowAddUnitModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>✕</button>
            </div>
            
            <form onSubmit={handleAddUnit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div className="form-group">
                  <label style={{ fontSize: 12 }}>Xonadon raqami *</label>
                  <input
                    type="text"
                    value={unitForm.unit_number}
                    onChange={(e) => setUnitForm(p => ({ ...p, unit_number: e.target.value }))}
                    placeholder="Masalan: 101"
                    required
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 12 }}>Qavat *</label>
                  <input
                    type="number"
                    value={unitForm.floor}
                    onChange={(e) => setUnitForm(p => ({ ...p, floor: e.target.value }))}
                    placeholder="1"
                    required
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div className="form-group">
                  <label style={{ fontSize: 12 }}>Maydoni (m²) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={unitForm.area}
                    onChange={(e) => setUnitForm(p => ({ ...p, area: e.target.value }))}
                    placeholder="54.5"
                    required
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 12 }}>Xonalar soni *</label>
                  <input
                    type="number"
                    value={unitForm.rooms}
                    onChange={(e) => setUnitForm(p => ({ ...p, rooms: e.target.value }))}
                    placeholder="2"
                    required
                    style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12 }}>Narxi ($) *</label>
                <input
                  type="number"
                  value={unitForm.price}
                  onChange={(e) => setUnitForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="45000"
                  required
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 4 }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Saqlanmoqda..." : "Xonadonni Saqlash"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── PRINTABLE SHARTNOMA GENERATOR MODAL ───────────────── */}
      {showContractModal && (
        <div className="modal-overlay no-print" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16,
          overflowY: "auto"
        }} onClick={() => setShowContractModal(null)}>
          
          <div className="contract-print-modal-inner" style={{
            width: "100%",
            maxWidth: 800,
            background: "#fff",
            borderRadius: 24,
            padding: 32,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            animation: "slideUp 0.25s ease",
            position: "relative"
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header controls inside modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd", paddingBottom: 16, marginBottom: 24 }} className="no-print">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Shartnoma Generator Loyihasi</h3>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handlePrint} className="btn btn-primary" style={{ padding: "8px 16px" }}>
                  <i className="ti ti-printer"></i> Shartnomani Chop Etish (Print)
                </button>
                <button onClick={() => setShowContractModal(null)} className="btn btn-secondary" style={{ padding: "8px 16px" }}>✕ Yopish</button>
              </div>
            </div>

            {/* PRINT CONTRACT CONTENT (Styled formally) */}
            <div className="printable-contract" style={{
              fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              color: "#000",
              lineHeight: "1.6",
              fontSize: 13,
              padding: "20px 10px"
            }}>
              
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, textTransform: "uppercase" }}>Xonadon Sotib Olish Shartnomasi</h2>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>№ {showContractModal.id * 12 + 1045}-SH</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                  <span>Toshkent shahri</span>
                  <span>«{new Date(showContractModal.sold_at).toLocaleDateString("uz-UZ")}» yil</span>
                </div>
              </div>

              <p>
                Bir tomondan, <strong>«MASKON-QURILISH» MCHJ</strong> (quruvchi korxona), keyingi o'rinlarda <strong>«Sotuvchi»</strong> deb yuritiladi, va ikkinchi tomondan, fuqaro <strong>{showContractModal.lead_name}</strong> (tel: {showContractModal.lead_phone}), keyingi o'rinlarda <strong>«Xaridor»</strong> deb yuritiladi, quyidagi shartnoma bo'yicha kelishdilar:
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 6px 0" }}>1. SHARTNOMA MAQSADI</h4>
              <p>
                1.1. Sotuvchi shartnoma shartlariga muvofiq o'zining qurilish loyihasi bo'lgan <strong>{showContractModal.project_name}</strong> turar-joy majmuasidan quyidagi xonadonni Xaridorga rasmiylashtirish majburiyatini oladi, Xaridor esa to'lovni o'z vaqtida amalga oshirish majburiyatini oladi.
              </p>

              <div className="printable-contract-box" style={{ border: "1px solid #000", padding: 12, borderRadius: 8, margin: "14px 0", background: "#fcfcfc" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>🏢 Loyiha: <strong>{showContractModal.project_name}</strong></div>
                  <div>🚪 Xonadon raqami: <strong>{showContractModal.unit_number}</strong></div>
                  <div>🪜 Qavat: <strong>{showContractModal.floor}-qavat</strong></div>
                  <div>📐 Maydoni: <strong>{showContractModal.area} m²</strong></div>
                  <div>🚪 Xonalar soni: <strong>{showContractModal.rooms} xona</strong></div>
                  <div>📍 Manzili: <strong>Toshkent, Uchtepa/Chilonzor loyihalari</strong></div>
                </div>
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 6px 0" }}>2. NARX VA TO'LOV SHARTLARI</h4>
              <p>
                2.1. Xonadonning umumiy sotilgan kelishilgan bahosi <strong>${parseInt(showContractModal.sold_price).toLocaleString()}</strong> (AQSH dollari ekvivalentida) etib belgilandi.
              </p>
              <p>
                2.2. To'lov turi: <strong>{showContractModal.payment_plan === 'cash' ? 'Naqd (100% to\'lov)' : showContractModal.payment_plan === 'installments' ? 'Nasiya / Bo\'lib to\'lash' : 'Ipoteka krediti'}</strong>.
              </p>
              <p>
                2.3. Boshlang'ich to'lov miqdori: <strong>${parseInt(showContractModal.initial_payment).toLocaleString()}</strong>. Hozirgacha to'langan jami summa: <strong>${parseInt(showContractModal.paid_amount).toLocaleString()}</strong>.
              </p>
              {showContractModal.payment_plan === 'installments' && (
                <p>
                  2.4. Qolgan summa <strong>${(parseInt(showContractModal.sold_price) - parseInt(showContractModal.paid_amount)).toLocaleString()}</strong> shartnoma ilovasidagi bo'lib to'lash grafigi asosida amalga oshiriladi.
                </p>
              )}

              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 6px 0" }}>3. TOMONLARNING MAJBURIYATLARI</h4>
              <p>
                3.1. Sotuvchi ob'ektni belgilangan muddatda va texnik talablarga mos ravishda foydalanishga topshirishi shart.
              </p>
              <p>
                3.2. Xaridor shartnomada belgilangan muddatda to'lovlarni to'liq hajmda kiritishi shart. To'lov kechiktirilgan taqdirda penya hisoblanadi.
              </p>

              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "24px 0 12px 0" }}>4. TOMONLARNING IMZOLARI VA REKVIZITLARI</h4>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 24, borderTop: "1px dashed #999", paddingTop: 16 }}>
                <div>
                  <strong>SOTUVCHI:</strong>
                  <div style={{ marginTop: 8 }}>«MASKON-QURILISH» MCHJ</div>
                  <div>Toshkent sh., Yunusobod 12-uy</div>
                  <div>H/R: 20208000600998877001</div>
                  <div style={{ marginTop: 30 }}>Imzo: _____________________</div>
                  <div style={{ fontSize: 11, color: "#666" }}>(M.O'.)</div>
                </div>
                <div>
                  <strong>XARIDOR:</strong>
                  <div style={{ marginTop: 8 }}>Ismi: {showContractModal.lead_name}</div>
                  <div>Tel: {showContractModal.lead_phone}</div>
                  <div>Pasport/ID: AA _________</div>
                  <div style={{ marginTop: 30 }}>Imzo: _____________________</div>
                </div>
              </div>

            </div>

            {/* Print style block */}
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .printable-contract, .printable-contract * {
                  visibility: visible;
                }
                .printable-contract {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
                .no-print {
                  display: none !important;
                }
              }
              
              /* Keyframes animations for visual elements */
              @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes slideDown {
                from { transform: translateY(-30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }

              /* Dark theme adaptive overrides for ERP/CRM panels */
              [data-theme="dark"] .create-agency-card {
                background: var(--card-bg) !important;
                color: var(--ink) !important;
                border: 1px solid var(--sand) !important;
              }
              [data-theme="dark"] .create-agency-card input,
              [data-theme="dark"] .create-agency-card select,
              [data-theme="dark"] .create-agency-card textarea {
                background: var(--cream) !important;
                color: var(--ink) !important;
                border: 1.5px solid var(--sand) !important;
              }
              [data-theme="dark"] .create-agency-card label {
                color: var(--text2) !important;
              }
              [data-theme="dark"] .kanban-column {
                background: var(--cream) !important;
                border-color: var(--sand) !important;
              }
              [data-theme="dark"] .kanban-badge {
                background: var(--sand) !important;
                color: var(--ink) !important;
              }
              [data-theme="dark"] .kanban-card {
                background: var(--card-bg) !important;
                border-color: var(--sand) !important;
                color: var(--ink) !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
              }
              [data-theme="dark"] .kanban-card select {
                background: var(--cream) !important;
                color: var(--ink) !important;
                border-color: var(--sand) !important;
              }
              [data-theme="dark"] .kanban-card-notes {
                background: var(--cream) !important;
                color: var(--text2) !important;
              }
              [data-theme="dark"] .dashboard-listings-table th {
                background: var(--sand) !important;
                color: var(--ink) !important;
              }
              [data-theme="dark"] .dashboard-listings-table td {
                border-bottom-color: var(--sand) !important;
              }
              [data-theme="dark"] .dashboard-listings-table tr:hover td {
                background: var(--cream) !important;
              }
              [data-theme="dark"] .progress-track {
                background: var(--sand) !important;
              }
              [data-theme="dark"] .contract-print-modal-inner {
                background: var(--card-bg) !important;
                color: var(--ink) !important;
                border: 1px solid var(--sand) !important;
              }
              [data-theme="dark"] .printable-contract {
                color: var(--ink) !important;
              }
              [data-theme="dark"] .printable-contract h2 {
                color: var(--ink) !important;
              }
              [data-theme="dark"] .printable-contract-box {
                background: var(--cream) !important;
                border-color: var(--sand) !important;
              }
            `}</style>
          </div>
        </div>
      )}

    </>
  );
}
