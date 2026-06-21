"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomSelect, CustomDateTimePicker } from "@/components/ui";
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
  erpUpdateUserRole,
  erpDeleteProject
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
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(urlTab || "overview");

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") !== activeTab) {
      params.set("tab", activeTab);
      router.push(`/erp?${params.toString()}`, { scroll: false });
    }
  }, [activeTab, router]);
  const [stats, setStats] = useState(initialStats);
  const [sellersPerformance, setSellersPerformance] = useState(initialSellersPerformance);
  const [projects, setProjects] = useState(initialProjects || []);
  const [selectedProject, setSelectedProject] = useState(initialProjects?.[0] || null);
  const [units, setUnits] = useState([]);
  const [leads, setLeads] = useState(initialLeads || []);
  const [meetings, setMeetings] = useState(initialMeetings || []);
  const [currentCalMonth, setCurrentCalMonth] = useState(new Date());
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
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
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

  const triggerDeleteProject = () => {
    setDeleteConfirmText("");
    setShowDeleteProjectModal(true);
  };

  const confirmDeleteProject = async () => {
    if (deleteConfirmText !== "o'chirilsin") {
      showToast("Iltimos, tasdiqlash uchun 'o'chirilsin' deb yozing", true);
      return;
    }
    setLoading(true);
    setShowDeleteProjectModal(false);
    try {
      const res = await erpDeleteProject(selectedProject.id);
      if (res.error) {
        showToast(res.error, true);
      } else {
        showToast("Loyiha muvaffaqiyatli o'chirildi!");
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      showToast("Loyihani o'chirishda xatolik yuz berdi", true);
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
              <Link href="/" onClick={handleBack} className="btn-back-modern">
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
                  background: "var(--sand)",
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
                          <div className="progress-track" style={{ height: 8, background: "var(--sand)", borderRadius: 4, overflow: "hidden" }}>
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
                        background: "var(--sand)",
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
                          background: "var(--card-bg)",
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

                          <div className="kanban-card-notes" style={{ fontSize: 12, color: "var(--text2)", background: "var(--cream)", padding: 6, borderRadius: 8, marginBottom: 12, fontStyle: "italic" }}>
                            {l.notes || "Izoh kiritilmagan"}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--sand)", paddingTop: 10, gap: 8 }}>
                            {/* ROP/Owner assignment */}
                            {(user.role === 'rop' || user.role === 'owner') ? (
                              <div style={{ width: 120 }}>
                                <CustomSelect
                                  value={l.assigned_to || ""}
                                  onChange={(val) => handleAssignLead(l.id, val)}
                                  options={sellers.map(s => ({ value: s.id, label: s.name }))}
                                  placeholder="Biriktirish..."
                                  className="csel-compact"
                                />
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                <i className="ti ti-user"></i> {l.seller_name || "Biriktirilmagan"}
                              </span>
                            )}

                            {/* Dropdown to change status */}
                            <div style={{ width: 110 }}>
                              <CustomSelect
                                value={l.status}
                                onChange={(val) => handleUpdateLeadStatus(l.id, val)}
                                options={[
                                  { value: "new", label: "Yangi lid" },
                                  { value: "contacted", label: "Aloqada" },
                                  { value: "meeting_scheduled", label: "Uchrashuv" },
                                  { value: "negotiation", label: "Muzokara" },
                                  { value: "won", label: "Sotib oldi" },
                                  { value: "lost", label: "Rad etildi" }
                                ]}
                                className="csel-compact"
                              />
                            </div>
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
        {activeTab === "scheduler" && (() => {
          const monthNames = [
            "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", 
            "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
          ];
          const weekDays = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

          const getDaysForCalendar = (date) => {
            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            const cells = [];
            for (let i = 0; i < firstDayIndex; i++) {
              cells.push(null);
            }
            for (let i = 1; i <= daysInMonth; i++) {
              const cellDate = new Date(year, month, i);
              const today = new Date();
              const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
              
              const meetingsForDay = meetings.filter(m => {
                const mDate = new Date(m.scheduled_time);
                return mDate.getDate() === i && mDate.getMonth() === month && mDate.getFullYear() === year;
              });

              cells.push({
                date: cellDate,
                isToday,
                meetingsForDay: meetingsForDay.sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))
              });
            }
            return cells;
          };

          const handleCalendarDayClick = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const localStr = `${year}-${month}-${day}T12:00`;
            setMeetingForm(p => ({ ...p, scheduled_time: localStr, lead_id: "" }));
            setShowScheduleMeetingModal(true);
          };

          const getGoogleCalendarUrl = (m) => {
            const startTime = new Date(m.scheduled_time);
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
            
            const formatUTC = (d) => {
              return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
            };

            const title = `Uchrashuv: ${m.lead_name || 'Mijoz'}`;
            const details = `Mavzu/Izoh: ${m.notes || '—'}\nMas'ul: ${m.seller_name || '—'}`;
            const location = m.location || '';
            
            return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatUTC(startTime)}/${formatUTC(endTime)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
          };

          return (
            <div className="dashboard-content" style={{ animation: "fadeIn 0.2s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Uchrashuvlar va Taqvim</h3>
                <button onClick={() => setShowScheduleMeetingModal(true)} className="btn btn-primary">
                  <i className="ti ti-calendar-plus"></i> Uchrashuv belgilash
                </button>
              </div>

              {/* Taqvim Grid View */}
              <div style={{
                background: "var(--card-bg)",
                border: "1px solid var(--sand)",
                borderRadius: 24,
                padding: 20,
                marginBottom: 24,
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
              }}>
                {/* Taqvim boshqaruvlari */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button 
                      onClick={() => setCurrentCalMonth(new Date(currentCalMonth.getFullYear(), currentCalMonth.getMonth() - 1, 1))} 
                      className="btn btn-secondary"
                      style={{ padding: "8px 12px", border: "1.5px solid var(--sand)", background: "transparent", color: "var(--ink)", cursor: "pointer", borderRadius: 10 }}
                    >
                      <i className="ti ti-chevron-left"></i>
                    </button>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                      {monthNames[currentCalMonth.getMonth()]} {currentCalMonth.getFullYear()}
                    </h4>
                    <button 
                      onClick={() => setCurrentCalMonth(new Date(currentCalMonth.getFullYear(), currentCalMonth.getMonth() + 1, 1))} 
                      className="btn btn-secondary"
                      style={{ padding: "8px 12px", border: "1.5px solid var(--sand)", background: "transparent", color: "var(--ink)", cursor: "pointer", borderRadius: 10 }}
                    >
                      <i className="ti ti-chevron-right"></i>
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      const today = new Date();
                      setCurrentCalMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                    }} 
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: "6px 12px", border: "1.5px solid var(--sand)", background: "transparent", color: "var(--ink)", cursor: "pointer", borderRadius: 10 }}
                  >
                    Bugun
                  </button>
                </div>

                {/* Taqvim oylik griddi */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 1,
                  background: "var(--sand)",
                  borderRadius: 16,
                  border: "1.5px solid var(--sand)",
                  overflow: "hidden"
                }}>
                  {weekDays.map(d => (
                    <div key={d} style={{
                      background: "var(--cream)",
                      padding: "10px 4px",
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--muted)"
                    }}>
                      {d}
                    </div>
                  ))}

                  {getDaysForCalendar(currentCalMonth).map((dayData, idx) => {
                    if (!dayData) {
                      return (
                        <div key={`cal-empty-${idx}`} style={{
                          background: "var(--card-bg)",
                          minHeight: 110,
                          opacity: 0.3
                        }}></div>
                      );
                    }

                    const { date, isToday, meetingsForDay } = dayData;
                    return (
                      <div 
                        key={date.toISOString()}
                        onClick={() => handleCalendarDayClick(date)}
                        style={{
                          background: "var(--card-bg)",
                          minHeight: 110,
                          padding: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--cream)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "var(--card-bg)"}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isToday ? "var(--orange)" : "transparent",
                            color: isToday ? "#fff" : "var(--ink)"
                          }}>
                            {date.getDate()}
                          </span>
                          {meetingsForDay.length > 0 && (
                            <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>
                              {meetingsForDay.length} ta
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 3, overflowY: "auto", flex: 1, maxHeight: 80 }} className="custom-scrollbar">
                          {meetingsForDay.map(m => {
                            const isCompleted = m.status === 'completed';
                            const isCancelled = m.status === 'cancelled';
                            
                            let bg = "var(--orange-tint)";
                            let color = "var(--orange-dark)";
                            if (isCompleted) {
                              bg = "var(--green-tint)";
                              color = "#16a34a";
                            } else if (isCancelled) {
                              bg = "#fde8e8";
                              color = "#dc2626";
                            }

                            const timeStr = new Date(m.scheduled_time).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' });

                            return (
                              <div 
                                key={m.id}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  background: bg,
                                  color: color,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: "3px 6px",
                                  borderRadius: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 2,
                                  textDecoration: isCancelled ? "line-through" : "none"
                                }}
                                title={`${m.lead_name}: ${m.notes || 'Izohsiz'}`}
                              >
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                  <strong>{timeStr}</strong> {m.lead_name}
                                </span>
                                <a
                                  href={getGoogleCalendarUrl(m)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "inherit", display: "inline-flex", padding: 2, marginLeft: 2 }}
                                  title="Google Calendar-ga qo'shish"
                                >
                                  <i className="ti ti-brand-google" style={{ fontSize: 10 }}></i>
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Uchrashuvlar ro'yxati (Meetings Table) */}
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
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              {m.status === 'scheduled' && (
                                <>
                                  <button 
                                    onClick={() => handleUpdateMeetingStatus(m.id, 'completed')} 
                                    className="btn btn-secondary" 
                                    style={{ padding: "4px 8px", fontSize: 11, background: "var(--green-tint)", color: "#16a34a", border: "none", cursor: "pointer", borderRadius: 8 }}
                                  >
                                    Yakunlandi
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateMeetingStatus(m.id, 'cancelled')} 
                                    className="btn btn-secondary" 
                                    style={{ padding: "4px 8px", fontSize: 11, background: "#fde8e8", color: "#dc2626", border: "none", cursor: "pointer", borderRadius: 8 }}
                                  >
                                    Bekor qilish
                                  </button>
                                </>
                              )}
                              <a
                                href={getGoogleCalendarUrl(m)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: 11,
                                  background: "var(--orange-tint)",
                                  color: "var(--orange-dark)",
                                  border: "none",
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  borderRadius: 8,
                                  cursor: "pointer"
                                }}
                                title="Google Calendar-ga qo'shish"
                              >
                                <i className="ti ti-brand-google"></i> Google Calendar
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

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
                    <div className="progress-track" style={{ height: 6, background: "var(--sand)", borderRadius: 3, overflow: "hidden" }}>
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
                      <>
                        <button 
                          onClick={triggerDeleteProject} 
                          className="btn btn-secondary" 
                          style={{ borderColor: "#dc2626", color: "#dc2626" }}
                        >
                          <i className="ti ti-trash"></i> Loyihani O'chirish
                        </button>
                        <button onClick={() => setShowAddUnitModal(true)} className="btn btn-secondary">
                          <i className="ti ti-plus"></i> Xonadon Qo'shish
                        </button>
                      </>
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
                          <CustomSelect
                            value={selectedProject[stage.key]}
                            onChange={(val) => handleProgressChange(selectedProject.id, stage.key, val)}
                            options={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(pct => ({ value: pct, label: `${pct}%` }))}
                            className="csel-compact"
                          />
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
                    <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                        <span style={{ width: 16, height: 16, borderRadius: 6, background: "rgba(29, 158, 117, 0.12)", border: "1.5px solid rgba(29, 158, 117, 0.35)", display: "inline-block" }}></span> Bo'sh (Available)
                      </span>
                      <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                        <span style={{ width: 16, height: 16, borderRadius: 6, background: "rgba(224, 99, 52, 0.12)", border: "1.5px solid rgba(224, 99, 52, 0.35)", display: "inline-block" }}></span> Bron qilingan (Reserved)
                      </span>
                      <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                        <span style={{ width: 16, height: 16, borderRadius: 6, background: "rgba(110, 102, 95, 0.1)", border: "1.5px solid var(--sand)", display: "inline-block" }}></span> Sotilgan (Sold)
                      </span>
                    </div>

                    {/* Group units by floor to render row-by-row */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                        <div key={floor} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          {/* Floor Label */}
                          <div style={{
                            width: 70,
                            height: 56,
                            background: "var(--cream)",
                            border: "1.5px solid var(--sand)",
                            borderRadius: 12,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            fontWeight: 800,
                            color: "var(--ink)",
                            flexShrink: 0,
                          }}>
                            <span>{floor}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginTop: 1, letterSpacing: "0.05em" }}>qavat</span>
                          </div>

                          {/* Apartments grid */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            {floorUnits.sort((a,b) => a.unit_number.localeCompare(b.unit_number)).map(u => {
                              const isReserved = u.status === 'reserved';
                              const isSold = u.status === 'sold';
                              
                              let bg = "rgba(29, 158, 117, 0.12)";
                              let color = "#1D9E75";
                              let border = "1.5px solid rgba(29, 158, 117, 0.35)";

                              if (isReserved) {
                                bg = "rgba(224, 99, 52, 0.12)";
                                color = "var(--orange-dark)";
                                border = "1.5px solid rgba(224, 99, 52, 0.35)";
                              } else if (isSold) {
                                bg = "rgba(110, 102, 95, 0.1)";
                                color = "var(--muted)";
                                border = "1.5px solid var(--sand)";
                              }

                              return (
                                <div
                                  key={u.id}
                                  onClick={() => {
                                    setSelectedUnitForAction(u);
                                    setBookingSoldPrice(u.price);
                                  }}
                                  style={{
                                    width: 96,
                                    height: 56,
                                    background: bg,
                                    color: color,
                                    border: border,
                                    borderRadius: 12,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    position: "relative",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                                  }}
                                  className="unit-grid-cell"
                                  title={`Xonadon ${u.unit_number}, ${u.rooms} xona, ${u.area} m²`}
                                >
                                  <span style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{u.unit_number}</span>
                                  <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85, marginTop: 1 }}>{u.rooms}x • {Math.round(u.area)}m²</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
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
                            <strong style={{ fontSize: 14, color: "var(--ink)" }}>{s.project_name}</strong>
                            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.unit_number}-xonadon · {s.rooms} xona · {s.area} m²</div>
                          </td>
                          <td>
                            <strong style={{ fontSize: 14, color: "var(--ink)" }}>{s.lead_name}</strong>
                            <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                              <i className="ti ti-phone" style={{ fontSize: 11 }}></i>
                              {s.lead_phone}
                            </div>
                          </td>
                          <td><strong style={{ fontSize: 14, color: outstanding === 0 ? "#1d9e75" : "var(--orange-dark)" }}>${parseInt(s.sold_price).toLocaleString()}</strong></td>
                          <td>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "4px 8px",
                              borderRadius: 6,
                              textTransform: "uppercase",
                              background: s.payment_plan === 'cash' ? "rgba(29, 158, 117, 0.1)" : s.payment_plan === 'installments' ? "rgba(224, 99, 52, 0.1)" : "rgba(24, 95, 165, 0.1)",
                              color: s.payment_plan === 'cash' ? "#1D9E75" : s.payment_plan === 'installments' ? "var(--orange-dark)" : "#185FA5",
                              border: s.payment_plan === 'cash' ? "1px solid rgba(29, 158, 117, 0.2)" : s.payment_plan === 'installments' ? "1px solid rgba(224, 99, 52, 0.2)" : "1px solid rgba(24, 95, 165, 0.2)"
                            }}>
                              {s.payment_plan === 'cash' ? 'Naqd' : s.payment_plan === 'installments' ? 'Nasiya' : 'Ipoteka'}
                            </span>
                          </td>
                          <td>
                            <div style={{ width: 150 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)" }}>
                                <span style={{ fontWeight: 600 }}>{percentPaid}% to'landi</span>
                                {outstanding > 0 && <span style={{ color: "var(--orange-dark)", fontWeight: 700 }}>Qarz: ${outstanding.toLocaleString()}</span>}
                              </div>
                              <div className="progress-track" style={{ height: 6, background: "var(--sand)", borderRadius: 3, overflow: "hidden", marginTop: 4 }}>
                                <div style={{ height: "100%", background: outstanding === 0 ? "#1D9E75" : "var(--orange)", width: `${percentPaid}%`, borderRadius: 3 }}></div>
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
                                    background: "var(--orange-tint)",
                                    color: "var(--orange-dark)",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    marginTop: 8,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 2,
                                    transition: "all 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--orange)"; e.currentTarget.style.color = "#fff"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--orange-tint)"; e.currentTarget.style.color = "var(--orange-dark)"; }}
                                >
                                  <i className="ti ti-plus"></i> To'lov qabul qilish
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ fontSize: 12, opacity: 0.8, color: "var(--ink)" }}>
                            {new Date(s.sold_at).toLocaleDateString("uz-UZ")}
                          </td>
                          <td style={{ fontSize: 13, color: "var(--ink)" }}>{s.seller_name || "—"}</td>
                          <td>
                            <button
                              onClick={() => triggerPrintContract(s)}
                              className="btn btn-secondary"
                              style={{
                                padding: "6px 12px",
                                fontSize: 11,
                                borderRadius: 8,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                cursor: "pointer",
                                background: "transparent",
                                border: "1.5px solid var(--sand)",
                                color: "var(--ink)",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <i className="ti ti-printer" style={{ fontSize: 13 }}></i> Chop etish
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
                          <div style={{ maxWidth: 140 }}>
                            <CustomSelect
                              value={member.role}
                              onChange={(val) => handleUserRoleChange(member.id, val)}
                              options={[
                                { value: "seller", label: "Sotuvchi" },
                                { value: "rop", label: "ROP" },
                                { value: "owner", label: "Owner (Xo'jayin)" }
                              ]}
                              className="csel-compact"
                            />
                          </div>
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
            background: "var(--card-bg)",
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

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 20px",
              fontSize: 13,
              background: "var(--cream)",
              padding: 16,
              borderRadius: 16,
              border: "1px solid var(--sand)",
              marginBottom: 20
            }}>
              <div>
                <span style={{ color: "var(--muted)", display: "block", fontSize: 11, marginBottom: 2 }}>QAVAT</span>
                <strong>{selectedUnitForAction.floor}-qavat</strong>
              </div>
              <div>
                <span style={{ color: "var(--muted)", display: "block", fontSize: 11, marginBottom: 2 }}>XONALAR SONI</span>
                <strong>{selectedUnitForAction.rooms} xona</strong>
              </div>
              <div>
                <span style={{ color: "var(--muted)", display: "block", fontSize: 11, marginBottom: 2 }}>UMUMIY MAYDON</span>
                <strong>{selectedUnitForAction.area} m²</strong>
              </div>
              <div>
                <span style={{ color: "var(--muted)", display: "block", fontSize: 11, marginBottom: 2 }}>BOSHLANG'ICH NARXI</span>
                <strong style={{ color: "var(--orange-dark)" }}>${parseInt(selectedUnitForAction.price).toLocaleString()}</strong>
              </div>
              <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--sand)", paddingTop: 12, marginTop: 4 }}>
                <span style={{ color: "var(--muted)", fontSize: 11 }}>XOLATI</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 8,
                  textTransform: "uppercase",
                  background: selectedUnitForAction.status === 'available' ? "rgba(29, 158, 117, 0.12)" : selectedUnitForAction.status === 'reserved' ? "rgba(224, 99, 52, 0.12)" : "rgba(110, 102, 95, 0.1)",
                  color: selectedUnitForAction.status === 'available' ? "#1D9E75" : selectedUnitForAction.status === 'reserved' ? "var(--orange-dark)" : "var(--muted)",
                  border: selectedUnitForAction.status === 'available' ? "1px solid rgba(29, 158, 117, 0.25)" : selectedUnitForAction.status === 'reserved' ? "1px solid rgba(224, 99, 52, 0.25)" : "1px solid var(--sand)"
                }}>
                  {selectedUnitForAction.status === 'available' ? 'Bo\'sh (Sotuvda)' : selectedUnitForAction.status === 'reserved' ? 'Band qilingan' : 'Sotilgan'}
                </span>
              </div>
              {selectedUnitForAction.status === 'reserved' && (
                <div style={{ gridColumn: "span 2", fontSize: 12, color: "var(--orange-dark)", background: "rgba(224, 99, 52, 0.08)", padding: "10px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-pin" style={{ fontSize: 14 }}></i>
                  <span>Bron muddati: <strong>{new Date(selectedUnitForAction.reserved_until).toLocaleDateString("uz-UZ")}</strong> gacha ({selectedUnitForAction.seller_name} tomonidan)</span>
                </div>
              )}
            </div>

            {/* If Available: allow reserving or selling */}
            {selectedUnitForAction.status === 'available' && (
              <form onSubmit={handleUnitBookingSubmit}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 6 }}>Harakat turi</label>
                  <div style={{ display: "flex", gap: 8, background: "var(--cream)", padding: 4, borderRadius: 12, border: "1.5px solid var(--sand)" }}>
                    <button
                      type="button"
                      onClick={() => setBookingType("reserve")}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: bookingType === "reserve" ? "var(--orange)" : "transparent",
                        color: bookingType === "reserve" ? "#fff" : "var(--ink)",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Bron qilish (Rezerv)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType("sell")}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: bookingType === "sell" ? "var(--orange)" : "transparent",
                        color: bookingType === "sell" ? "#fff" : "var(--ink)",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Sotuvni rasmiylashtirish
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Xaridor (Mijoz) *</label>
                  <CustomSelect
                    value={bookingLeadId}
                    onChange={(val) => setBookingLeadId(val)}
                    options={activeLeads.map(l => ({ value: l.id, label: `${l.name} (${l.phone})` }))}
                    placeholder="Mijozni tanlang..."
                  />
                </div>

                {bookingType === "reserve" ? (
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Bron muddati (kunlarda) *</label>
                    <CustomSelect
                      value={bookingReserveDays}
                      onChange={(val) => setBookingReserveDays(parseInt(val))}
                      options={[
                        { value: 1, label: "1 kun" },
                        { value: 3, label: "3 kun" },
                        { value: 5, label: "5 kun" },
                        { value: 7, label: "7 kun (1 hafta)" }
                      ]}
                    />
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
                        <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>To'lov turi</label>
                        <CustomSelect
                          value={bookingPaymentPlan}
                          onChange={(val) => setBookingPaymentPlan(val)}
                          options={[
                            { value: "cash", label: "Naqd to'liq" },
                            { value: "installments", label: "Bo'lib to'lash (Nasiya)" },
                            { value: "mortgage", label: "Ipoteka krediti" }
                          ]}
                        />
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
            background: "var(--card-bg)",
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
            background: "var(--card-bg)",
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
                  <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Manba</label>
                  <CustomSelect
                    value={leadForm.source}
                    onChange={(val) => setLeadForm(p => ({ ...p, source: val }))}
                    options={[
                      { value: "telegram", label: "Telegram" },
                      { value: "instagram", label: "Instagram" },
                      { value: "website", label: "Vebsayt" },
                      { value: "recommendation", label: "Tavsiya" },
                      { value: "walk_in", label: "Ofisga kelgan" }
                    ]}
                  />
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
            background: "var(--card-bg)",
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
                <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Mijoz (Lid) *</label>
                <CustomSelect
                  value={meetingForm.lead_id}
                  onChange={(val) => setMeetingForm(p => ({ ...p, lead_id: val }))}
                  options={activeLeads.map(l => ({ value: l.id, label: `${l.name} (${l.phone})` }))}
                  placeholder="Mijozni tanlang..."
                />
              </div>

              <div className="form-group" style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12 }}>Uchrashuv vaqti *</label>
                <CustomDateTimePicker
                  value={meetingForm.scheduled_time}
                  onChange={(val) => setMeetingForm(p => ({ ...p, scheduled_time: val }))}
                  placeholder="Uchrashuv sanasi va vaqtini tanlang..."
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
                  <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Mas'ul sotuvchi</label>
                  <CustomSelect
                    value={meetingForm.user_id}
                    onChange={(val) => setMeetingForm(p => ({ ...p, user_id: val }))}
                    options={[
                      { value: "", label: "O'zim (yoki tanlang)" },
                      ...sellers.map(s => ({ value: s.id, label: s.name }))
                    ]}
                    placeholder="Sotuvchini tanlang..."
                  />
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
            background: "var(--card-bg)",
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

      {/* ───────────────── MODAL: DELETE PROJECT CONFIRMATION ───────────────── */}
      {showDeleteProjectModal && selectedProject && (
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
        }} onClick={() => setShowDeleteProjectModal(false)}>
          <div className="create-agency-card" style={{
            width: "100%",
            maxWidth: 450,
            background: "var(--card-bg)",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            animation: "slideUp 0.2s ease"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--sand)", paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="ti ti-alert-triangle"></i> Loyihani O'chirish
              </h3>
              <button onClick={() => setShowDeleteProjectModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>✕</button>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 14, margin: "0 0 12px 0", lineHeight: "1.5" }}>
                Haqiqatan ham <strong>{selectedProject.name}</strong> loyihasini o'chirmoqchisiz?
              </p>
              <div style={{ background: "rgba(220, 38, 38, 0.08)", borderLeft: "3px solid #dc2626", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "#b91c1c", margin: 0 }}>
                  <strong>Diqqat:</strong> Loyiha o'chirilganda, unga tegishli barcha xonadonlar va sotuvlar ham ma'lumotlar bazasidan butunlay o'chib ketadi! Bu amalni ortga qaytarib bo'lmaydi.
                </p>
              </div>
              <div className="form-group">
                <label style={{ fontSize: 12, color: "var(--muted)" }}>
                  Tasdiqlash uchun pastga <strong>o'chirilsin</strong> deb yozing:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="o'chirilsin"
                  style={{ width: "100%", padding: 10, border: "1.5px solid var(--sand)", borderRadius: 12, marginTop: 8 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowDeleteProjectModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Bekor qilish
              </button>
              <button 
                onClick={confirmDeleteProject} 
                className="btn btn-primary" 
                style={{ flex: 1, backgroundColor: "#dc2626", borderColor: "#dc2626" }}
                disabled={deleteConfirmText !== "o'chirilsin" || loading}
              >
                {loading ? "O'chirilmoqda..." : "Tasdiqlayman"}
              </button>
            </div>
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
            background: "var(--card-bg)",
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
            background: "var(--card-bg)",
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
            <style dangerouslySetInnerHTML={{ __html: `
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
              
              /* Premium Shaxmatka cell styling */
              .unit-grid-cell {
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
              }
              .unit-grid-cell:hover {
                transform: translateY(-2px) scale(1.03);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1) !important;
                filter: brightness(1.04);
                z-index: 5;
              }
              .unit-grid-cell:active {
                transform: translateY(0) scale(0.98);
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

              /* Custom select compact styling for cards and tables */
              .csel-compact .csel-trigger {
                padding: 4px 10px !important;
                font-size: 11px !important;
                border-radius: 8px !important;
                min-height: auto !important;
                background-color: #ffffff;
                color: var(--ink) !important;
                border: 1px solid var(--sand) !important;
              }
              .csel-compact .csel-arrow {
                font-size: 10px !important;
              }
              .csel-compact .csel-dropdown {
                border-radius: 10px !important;
                box-shadow: 0 8px 24px rgba(26,19,14,.08) !important;
              }
              .csel-compact .csel-option {
                padding: 6px 12px !important;
                font-size: 11px !important;
              }
              [data-theme="dark"] .csel-compact .csel-trigger {
                background-color: #231F1A !important;
                border-color: var(--sand) !important;
              }

              /* Global input overrides in dark mode */
              [data-theme="dark"] input,
              [data-theme="dark"] textarea {
                background-color: #231F1A !important;
                color: var(--ink) !important;
                border-color: var(--sand) !important;
              }
              [data-theme="dark"] input:focus,
              [data-theme="dark"] textarea:focus {
                border-color: var(--orange) !important;
                box-shadow: 0 0 0 3px var(--orange-tint) !important;
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

              /* Modern Back Button & Alignment overrides */
              .btn-back-modern {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                font-weight: 600;
                color: var(--text2) !important;
                background: var(--cream) !important;
                border: 1px solid var(--sand) !important;
                padding: 6px 14px;
                border-radius: 20px;
                transition: all 0.2s ease;
                text-decoration: none;
                cursor: pointer;
              }
              .btn-back-modern:hover {
                background: var(--sand) !important;
                color: var(--orange) !important;
                border-color: var(--orange) !important;
                transform: translateX(-3px);
              }
              .btn-back-modern i {
                font-size: 14px;
              }
              .dashboard-header-inner {
                padding: 4px 0;
              }
              .dashboard-title-block {
                margin-left: 4px;
              }
              .dashboard-title {
                font-family: 'Bricolage Grotesque', sans-serif;
                font-size: 24px !important;
                font-weight: 800 !important;
                color: var(--ink) !important;
                margin: 0 0 4px 0 !important;
              }
              .dashboard-subtitle {
                font-size: 13px !important;
                color: var(--text2) !important;
                margin: 0 !important;
              }

              /* Dark theme background correction for header */
              [data-theme="dark"] .dashboard-header {
                background: var(--card-bg) !important;
                border-bottom-color: var(--sand) !important;
              }

              /* Mobile responsive alignment overrides for btn-back-modern */
              @media (max-width: 768px) {
                .btn-back-modern {
                  grid-column: 1 !important;
                  grid-row: 1 !important;
                  justify-self: start !important;
                  background: var(--sand) !important;
                  padding: 6px 12px !important;
                  font-size: 12px !important;
                }
              }

              /* Prevent modals from overflowing screen height */
              .modal-overlay .create-agency-card {
                max-height: 85vh !important;
                overflow-y: auto !important;
              }
            ` }} />
          </div>
        </div>
      )}

    </>
  );
}
