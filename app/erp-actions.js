"use server";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/actions";

// Initialize additional tables dynamically
async function initFeatureTables() {
  if (global.featureTablesInitialized) return;
  try {
    // 1. Create erp_tasks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS erp_tasks (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES erp_leads(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        due_date TIMESTAMP,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Create erp_notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS erp_notifications (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL, -- 'sms', 'telegram'
        recipient VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'sent',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    global.featureTablesInitialized = true;
    console.log("✅ Custom ERP feature tables verified/created.");
  } catch (error) {
    console.error("❌ initFeatureTables error:", error);
  }
}

// Helper to check access and roles
async function verifyAccess(allowedRoles = ["owner", "rop", "seller"]) {
  await initFeatureTables();
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Tizimga kirmagansiz!");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Ushbu amalni bajarishga huquqingiz yo'q!");
  }
  return user;
}


// 1. Overview Statistics
export async function erpGetOverviewStats() {
  const user = await verifyAccess();
  
  try {
    // Check and release expired reservations dynamically
    await pool.query(`
      UPDATE erp_units 
      SET status = 'available', reserved_until = NULL, reserved_by = NULL 
      WHERE status = 'reserved' AND reserved_until < NOW();
    `);

    let stats = {
      totalLeads: 0,
      newLeads: 0,
      wonLeads: 0,
      scheduledMeetings: 0,
      totalSalesVolume: 0,
      totalCashIn: 0,
      totalOutstanding: 0,
      totalUnits: 0,
      availableUnits: 0,
      reservedUnits: 0,
      soldUnits: 0,
      role: user.role,
      userName: user.name
    };

    // Get Units count
    const unitCountRes = await pool.query(`
      SELECT status, COUNT(*), SUM(price) as total_value
      FROM erp_units
      GROUP BY status
    `);
    
    unitCountRes.rows.forEach(r => {
      const count = parseInt(r.count, 10);
      stats.totalUnits += count;
      if (r.status === 'available') stats.availableUnits = count;
      if (r.status === 'reserved') stats.reservedUnits = count;
      if (r.status === 'sold') stats.soldUnits = count;
    });

    // Get Leads statistics based on role
    let leadQuery = "SELECT status, COUNT(*) FROM erp_leads";
    let leadParams = [];
    if (user.role === 'seller') {
      leadQuery += " WHERE assigned_to = $1";
      leadParams.push(user.id);
    }
    leadQuery += " GROUP BY status";
    
    const leadCountRes = await pool.query(leadQuery, leadParams);
    leadCountRes.rows.forEach(r => {
      const count = parseInt(r.count, 10);
      stats.totalLeads += count;
      if (r.status === 'new') stats.newLeads = count;
      if (r.status === 'won') stats.wonLeads = count;
    });

    // Meetings count (scheduled or completed)
    let meetingQuery = "SELECT COUNT(*) FROM erp_meetings m JOIN erp_leads l ON m.lead_id = l.id WHERE m.status = 'scheduled'";
    let meetingParams = [];
    if (user.role === 'seller') {
      meetingQuery += " AND l.assigned_to = $1";
      meetingParams.push(user.id);
    }
    const meetingCountRes = await pool.query(meetingQuery, meetingParams);
    stats.scheduledMeetings = parseInt(meetingCountRes.rows[0].count, 10);

    // Sales volume, cash in, and outstanding balance
    let salesQuery = `
      SELECT SUM(sold_price) as volume, 
             SUM(paid_amount) as cash, 
             SUM(sold_price - paid_amount) as outstanding 
      FROM erp_sales
    `;
    let salesParams = [];
    if (user.role === 'seller') {
      salesQuery += " WHERE sold_by = $1";
      salesParams.push(user.id);
    }
    const salesStatsRes = await pool.query(salesQuery, salesParams);
    stats.totalSalesVolume = parseInt(salesStatsRes.rows[0].volume || 0, 10);
    stats.totalCashIn = parseInt(salesStatsRes.rows[0].cash || 0, 10);
    stats.totalOutstanding = parseInt(salesStatsRes.rows[0].outstanding || 0, 10);

    // Additional data for ROP/Owner: Seller KPI performance
    let sellersPerformance = [];
    if (user.role === 'rop' || user.role === 'owner') {
      const perfRes = await pool.query(`
        SELECT u.id, u.name, 
               COUNT(DISTINCT l.id) as leads_count,
               COUNT(DISTINCT s.id) as sales_count,
               COALESCE(SUM(s.sold_price), 0) as sales_volume
        FROM users u
        LEFT JOIN erp_leads l ON l.assigned_to = u.id
        LEFT JOIN erp_sales s ON s.sold_by = u.id
        WHERE u.role = 'seller'
        GROUP BY u.id, u.name
        ORDER BY sales_volume DESC
      `);
      sellersPerformance = perfRes.rows;
    }

    return {
      success: true,
      stats,
      sellersPerformance
    };
  } catch (error) {
    console.error("erpGetOverviewStats error:", error);
    return { error: error.message || "Statistikani yuklashda xatolik" };
  }
}

// 2. Project & Unit Management
export async function erpGetProjects() {
  await verifyAccess();
  try {
    const { rows } = await pool.query(`
      SELECT p.*, 
             COUNT(u.id) as total_units,
             COUNT(CASE WHEN u.status = 'available' THEN 1 END) as available_units,
             COUNT(CASE WHEN u.status = 'reserved' THEN 1 END) as reserved_units,
             COUNT(CASE WHEN u.status = 'sold' THEN 1 END) as sold_units
      FROM erp_projects p
      LEFT JOIN erp_units u ON u.project_id = p.id
      GROUP BY p.id
      ORDER BY p.id DESC
    `);
    return rows;
  } catch (error) {
    console.error("erpGetProjects error:", error);
    return [];
  }
}

export async function erpAddProject(formData) {
  await verifyAccess(["owner", "rop"]);
  const name = formData.get("name");
  const description = formData.get("description");
  const location = formData.get("location");
  const budget = parseInt(formData.get("budget")) || 0;
  const start_date = formData.get("start_date");
  const end_date = formData.get("end_date");

  try {
    await pool.query(
      `INSERT INTO erp_projects (name, description, location, budget, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, 'planning', $5, $6)`,
      [name, description, location, budget, start_date || null, end_date || null]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpAddProject error:", error);
    return { error: "Loyihani yaratishda xatolik yuz berdi" };
  }
}

export async function erpUpdateProjectProgress(projectId, stages = {}) {
  await verifyAccess(["owner", "rop"]);
  const { kotlovan = 0, brick = 0, facade = 0, interior = 0 } = stages || {};
  try {
    await pool.query(
      `UPDATE erp_projects 
       SET progress_kotlovan = $1, progress_brick = $2, progress_facade = $3, progress_interior = $4
       WHERE id = $5`,
      [
        parseInt(kotlovan) || 0,
        parseInt(brick) || 0,
        parseInt(facade) || 0,
        parseInt(interior) || 0,
        projectId
      ]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpUpdateProjectProgress error:", error);
    return { error: "Loyihani yangilashda xatolik" };
  }
}

export async function erpGetUnits(projectId) {
  await verifyAccess();
  try {
    // Auto-update expired reservations before returning units
    await pool.query(`
      UPDATE erp_units 
      SET status = 'available', reserved_until = NULL, reserved_by = NULL 
      WHERE status = 'reserved' AND reserved_until < NOW();
    `);

    const { rows } = await pool.query(
      `SELECT u.*, us.name as seller_name 
       FROM erp_units u
       LEFT JOIN users us ON u.reserved_by = us.id
       WHERE u.project_id = $1
       ORDER BY u.floor DESC, u.unit_number ASC`,
      [projectId]
    );
    return rows;
  } catch (error) {
    console.error("erpGetUnits error:", error);
    return [];
  }
}

export async function erpAddUnit(formData) {
  await verifyAccess(["owner", "rop"]);
  const projectId = parseInt(formData.get("project_id"));
  const unitNumber = formData.get("unit_number");
  const floor = parseInt(formData.get("floor")) || 1;
  const area = parseFloat(formData.get("area")) || 0;
  const rooms = parseInt(formData.get("rooms")) || 1;
  const price = parseInt(formData.get("price")) || 0;

  try {
    await pool.query(
      `INSERT INTO erp_units (project_id, unit_number, floor, area, rooms, price, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'available')`,
      [projectId, unitNumber, floor, area, rooms, price]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpAddUnit error:", error);
    return { error: "Xonadon qo'shishda xatolik yuz berdi" };
  }
}

// 3. Lead / CRM Management
export async function erpGetLeads() {
  const user = await verifyAccess();
  try {
    let query = `
      SELECT l.*, u.name as seller_name,
             (SELECT COUNT(*) FROM erp_tasks WHERE lead_id = l.id) as total_tasks,
             (SELECT COUNT(*) FROM erp_tasks WHERE lead_id = l.id AND is_completed = TRUE) as completed_tasks
      FROM erp_leads l
      LEFT JOIN users u ON l.assigned_to = u.id
    `;
    let params = [];
    if (user.role === 'seller') {
      query += " WHERE l.assigned_to = $1";
      params.push(user.id);
    }
    query += " ORDER BY l.id DESC";

    const { rows } = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error("erpGetLeads error:", error);
    return [];
  }
}

export async function erpAddLead(formData) {
  const user = await verifyAccess();
  const name = formData.get("name");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const source = formData.get("source") || "website";
  const budget = parseInt(formData.get("budget")) || 0;
  const notes = formData.get("notes");
  
  // Sellers automatically get assigned their own leads, ROP/Owner can assign later
  const assigned_to = user.role === 'seller' ? user.id : null;

  try {
    await pool.query(
      `INSERT INTO erp_leads (name, phone, email, source, status, budget, notes, assigned_to)
       VALUES ($1, $2, $3, $4, 'new', $5, $6, $7)`,
      [name, phone, email, source, budget, notes, assigned_to]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpAddLead error:", error);
    return { error: "Mijoz qo'shishda xatolik yuz berdi" };
  }
}

export async function erpAssignLeadToSeller(leadId, sellerId) {
  await verifyAccess(["owner", "rop"]);
  const targetSellerId = sellerId ? parseInt(sellerId) : null;
  try {
    await pool.query(
      "UPDATE erp_leads SET assigned_to = $1 WHERE id = $2",
      [targetSellerId, leadId]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpAssignLeadToSeller error:", error);
    return { error: "Mijozni biriktirishda xatolik" };
  }
}

export async function erpUpdateLeadStatus(leadId, status) {
  const user = await verifyAccess();
  try {
    // Seller authorization check: can only update their own leads
    if (user.role === 'seller') {
      const { rows } = await pool.query("SELECT assigned_to FROM erp_leads WHERE id = $1", [leadId]);
      if (rows.length === 0 || rows[0].assigned_to !== user.id) {
        return { error: "Ushbu mijoz sizga biriktirilmagan!" };
      }
    }

    await pool.query(
      "UPDATE erp_leads SET status = $1 WHERE id = $2",
      [status, leadId]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpUpdateLeadStatus error:", error);
    return { error: "Mijoz statusini o'zgartirishda xatolik" };
  }
}

// 4. Meeting Scheduler
export async function erpGetMeetings() {
  const user = await verifyAccess();
  try {
    let query = `
      SELECT m.*, l.name as lead_name, l.phone as lead_phone, u.name as seller_name
      FROM erp_meetings m
      JOIN erp_leads l ON m.lead_id = l.id
      LEFT JOIN users u ON m.user_id = u.id
    `;
    let params = [];
    if (user.role === 'seller') {
      query += " WHERE m.user_id = $1";
      params.push(user.id);
    }
    query += " ORDER BY m.scheduled_time ASC";

    const { rows } = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error("erpGetMeetings error:", error);
    return [];
  }
}

export async function erpAddMeeting(formData) {
  const user = await verifyAccess();
  const leadId = parseInt(formData.get("lead_id"));
  const scheduledTime = formData.get("scheduled_time");
  const location = formData.get("location") || "Ofis";
  const notes = formData.get("notes");
  const assignedSellerId = user.role === 'seller' ? user.id : (formData.get("user_id") ? parseInt(formData.get("user_id")) : user.id);

  try {
    await pool.query("BEGIN");

    // Add meeting
    await pool.query(
      `INSERT INTO erp_meetings (lead_id, user_id, scheduled_time, location, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled')`,
      [leadId, assignedSellerId, scheduledTime, location, notes]
    );

    // Auto-update lead status to 'meeting_scheduled'
    await pool.query(
      `UPDATE erp_leads SET status = 'meeting_scheduled', assigned_to = COALESCE(assigned_to, $1) WHERE id = $2`,
      [assignedSellerId, leadId]
    );

    await pool.query("COMMIT");
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("erpAddMeeting error:", error);
    return { error: "Uchrashuv rejalashtirishda xatolik yuz berdi" };
  }
}

export async function erpUpdateMeetingStatus(meetingId, status) {
  const user = await verifyAccess();
  try {
    if (user.role === 'seller') {
      const { rows } = await pool.query("SELECT user_id FROM erp_meetings WHERE id = $1", [meetingId]);
      if (rows.length === 0 || rows[0].user_id !== user.id) {
        return { error: "Ushbu uchrashuv sizga tegishli emas!" };
      }
    }

    await pool.query("BEGIN");
    
    // Update meeting status
    await pool.query(
      "UPDATE erp_meetings SET status = $1 WHERE id = $2",
      [status, meetingId]
    );

    // If meeting is completed, update the lead's status to 'negotiation'
    if (status === 'completed') {
      const meetingDetails = await pool.query("SELECT lead_id FROM erp_meetings WHERE id = $1", [meetingId]);
      if (meetingDetails.rows.length > 0) {
        const leadId = meetingDetails.rows[0].lead_id;
        await pool.query(
          "UPDATE erp_leads SET status = 'negotiation' WHERE id = $1 AND status = 'meeting_scheduled'",
          [leadId]
        );
      }
    }

    await pool.query("COMMIT");
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("erpUpdateMeetingStatus error:", error);
    return { error: "Uchrashuv holatini o'zgartirishda xatolik" };
  }
}

// 5. Sales & Installments
export async function erpGetSales() {
  const user = await verifyAccess();
  try {
    let query = `
      SELECT s.*, 
             u.unit_number, u.floor, u.rooms, u.area,
             p.name as project_name,
             l.name as lead_name, l.phone as lead_phone,
             us.name as seller_name
      FROM erp_sales s
      JOIN erp_units u ON s.unit_id = u.id
      JOIN erp_projects p ON u.project_id = p.id
      JOIN erp_leads l ON s.lead_id = l.id
      LEFT JOIN users us ON s.sold_by = us.id
    `;
    let params = [];
    if (user.role === 'seller') {
      query += " WHERE s.sold_by = $1";
      params.push(user.id);
    }
    query += " ORDER BY s.sold_at DESC";

    const { rows } = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error("erpGetSales error:", error);
    return [];
  }
}

export async function erpReserveUnit(unitId, leadId, expiresAt, sellerId) {
  const user = await verifyAccess();
  const resBy = sellerId ? parseInt(sellerId) : user.id;

  try {
    await pool.query("BEGIN");
    
    // Update unit status to reserved
    await pool.query(
      `UPDATE erp_units 
       SET status = 'reserved', reserved_until = $1, reserved_by = $2 
       WHERE id = $3 AND status = 'available'`,
      [expiresAt, resBy, unitId]
    );

    // Update lead status to negotiation if it is not won/lost
    if (leadId) {
      await pool.query(
        "UPDATE erp_leads SET status = 'negotiation' WHERE id = $1 AND status NOT IN ('won', 'lost')",
        [leadId]
      );
    }

    await pool.query("COMMIT");
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("erpReserveUnit error:", error);
    return { error: "Xonadonni band qilishda xatolik" };
  }
}

export async function erpAddSale(formData) {
  const user = await verifyAccess();
  const unitId = parseInt(formData.get("unit_id"));
  const leadId = parseInt(formData.get("lead_id"));
  const soldPrice = parseInt(formData.get("sold_price"));
  const paymentPlan = formData.get("payment_plan") || "cash";
  const initialPayment = parseInt(formData.get("initial_payment")) || 0;
  const paidAmount = parseInt(formData.get("paid_amount")) || 0;
  const soldBy = user.role === 'seller' ? user.id : (formData.get("sold_by") ? parseInt(formData.get("sold_by")) : user.id);

  try {
    await pool.query("BEGIN");

    // 1. Insert into erp_sales
    await pool.query(
      `INSERT INTO erp_sales (unit_id, lead_id, sold_price, payment_plan, initial_payment, paid_amount, status, sold_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [unitId, leadId, soldPrice, paymentPlan, initialPayment, paidAmount, paymentPlan === 'cash' ? 'completed' : 'active', soldBy]
    );

    // 2. Update erp_units status to sold
    await pool.query(
      `UPDATE erp_units SET status = 'sold', reserved_until = NULL, reserved_by = NULL WHERE id = $1`,
      [unitId]
    );

    // 3. Update erp_leads status to won
    await pool.query(
      `UPDATE erp_leads SET status = 'won' WHERE id = $1`,
      [leadId]
    );

    await pool.query("COMMIT");
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("erpAddSale error:", error);
    return { error: "Sotuvni rasmiylashtirishda xatolik yuz berdi" };
  }
}

export async function erpRecordPayment(saleId, amount) {
  await verifyAccess(["owner", "rop"]);
  const paymentAmount = parseInt(amount) || 0;

  try {
    await pool.query("BEGIN");
    
    // Update paid_amount
    const { rows } = await pool.query(
      `UPDATE erp_sales 
       SET paid_amount = paid_amount + $1 
       WHERE id = $2 
       RETURNING sold_price, paid_amount`,
      [paymentAmount, saleId]
    );

    if (rows.length > 0) {
      const { sold_price, paid_amount } = rows[0];
      // If paid amount equals or exceeds sold price, set status to completed
      if (parseInt(paid_amount) >= parseInt(sold_price)) {
        await pool.query(
          "UPDATE erp_sales SET status = 'completed' WHERE id = $1",
          [saleId]
        );
      }
    }

    await pool.query("COMMIT");
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("erpRecordPayment error:", error);
    return { error: "To'lovni kiritishda xatolik yuz berdi" };
  }
}

// 6. User Management (ROP/Owner)
export async function erpGetSellers() {
  await verifyAccess();
  try {
    const { rows } = await pool.query(
      "SELECT id, name, phone, role FROM users WHERE role = 'seller' OR role = 'rop' ORDER BY name ASC"
    );
    return rows;
  } catch (error) {
    console.error("erpGetSellers error:", error);
    return [];
  }
}

export async function erpGetAllStaff() {
  await verifyAccess(["owner"]);
  try {
    const { rows } = await pool.query(
      "SELECT id, name, phone, role, created_at FROM users WHERE role IN ('owner', 'rop', 'seller') ORDER BY id ASC"
    );
    return rows;
  } catch (error) {
    console.error("erpGetAllStaff error:", error);
    return [];
  }
}

export async function erpUpdateUserRole(targetUserId, newRole) {
  await verifyAccess(["owner"]);
  try {
    await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2",
      [newRole, targetUserId]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpUpdateUserRole error:", error);
    return { error: "Xodim rolini o'zgartirishda xatolik" };
  }
}

export async function erpDeleteProject(projectId) {
  await verifyAccess(["owner", "rop"]);
  try {
    await pool.query("DELETE FROM erp_projects WHERE id = $1", [projectId]);
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpDeleteProject error:", error);
    return { error: "Loyihani o'chirishda xatolik yuz berdi" };
  }
}

// 7. Task Management (To-Do List) Actions
export async function erpGetTasks(leadId) {
  await verifyAccess();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM erp_tasks WHERE lead_id = $1 ORDER BY due_date ASC, id ASC",
      [leadId]
    );
    return rows;
  } catch (error) {
    console.error("erpGetTasks error:", error);
    return [];
  }
}

export async function erpAddTask(leadId, title, dueDate) {
  await verifyAccess();
  try {
    const parsedDate = dueDate ? new Date(dueDate) : null;
    await pool.query(
      "INSERT INTO erp_tasks (lead_id, title, due_date) VALUES ($1, $2, $3)",
      [leadId, title, parsedDate]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpAddTask error:", error);
    return { error: "Vazifa qo'shishda xatolik" };
  }
}

export async function erpToggleTask(taskId) {
  await verifyAccess();
  try {
    await pool.query(
      "UPDATE erp_tasks SET is_completed = NOT is_completed WHERE id = $1",
      [taskId]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpToggleTask error:", error);
    return { error: "Vazifa holatini o'zgartirishda xatolik" };
  }
}

export async function erpDeleteTask(taskId) {
  await verifyAccess();
  try {
    await pool.query("DELETE FROM erp_tasks WHERE id = $1", [taskId]);
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpDeleteTask error:", error);
    return { error: "Vazifani o'chirishda xatolik" };
  }
}

// 8. Notifications Log & Automatic Simulators
export async function erpGetNotifications() {
  await verifyAccess();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM erp_notifications ORDER BY sent_at DESC LIMIT 50"
    );
    return rows;
  } catch (error) {
    console.error("erpGetNotifications error:", error);
    return [];
  }
}

export async function erpSendManualNotification(type, recipient, message) {
  await verifyAccess();
  try {
    await pool.query(
      "INSERT INTO erp_notifications (type, recipient, message, status) VALUES ($1, $2, $3, 'sent')",
      [type, recipient, message]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpSendManualNotification error:", error);
    return { error: "Eslatma yuborishda xatolik" };
  }
}

export async function erpCheckAndSendAutomaticNotifications() {
  await verifyAccess();
  let createdCount = 0;
  const now = new Date();
  
  try {
    // 1. Check Installments due in 3 days (Mijozlar to'lov grafigiga 3 kun qolganda)
    const activeSalesRes = await pool.query(`
      SELECT s.*, l.name as lead_name, l.phone as lead_phone, p.name as project_name, u.unit_number
      FROM erp_sales s
      JOIN erp_leads l ON s.lead_id = l.id
      JOIN erp_units u ON s.unit_id = u.id
      JOIN erp_projects p ON u.project_id = p.id
      WHERE s.payment_plan = 'installments' AND s.status = 'active'
    `);
    
    for (const s of activeSalesRes.rows) {
      const soldAt = new Date(s.sold_at);
      const totalAmount = parseInt(s.sold_price);
      const initPayment = parseInt(s.initial_payment);
      const monthlyInstallment = Math.round((totalAmount - initPayment) / 12);
      
      for (let i = 1; i <= 12; i++) {
        // Due Date = soldAt + i months
        const dueDate = new Date(soldAt.getFullYear(), soldAt.getMonth() + i, soldAt.getDate());
        const diffDays = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // If due date is in exactly 3 days (allow window 2.5 to 3.5 days)
        if (diffDays === 3) {
          const neededCumulative = initPayment + i * monthlyInstallment;
          if (parseInt(s.paid_amount) < neededCumulative) {
            // Check if reminder was already sent for this due date
            const dateStr = dueDate.toLocaleDateString("uz-UZ");
            const alreadySent = await pool.query(
              "SELECT id FROM erp_notifications WHERE recipient = $1 AND message LIKE $2",
              [s.lead_phone, `%${dateStr}%`]
            );
            
            if (alreadySent.rows.length === 0) {
              const msg = `Hurmatli ${s.lead_name}! Sizning "${s.project_name}" loyihasidagi ${s.unit_number}-xonadon uchun shartnoma bo'yicha ${i}-sonli to'lov muddati yaqinlashmoqda. To'lov sanasi: ${dateStr}. Kutilayotgan summa: $${monthlyInstallment.toLocaleString()}. Iltimos, to'lovni kiritishingizni so'raymiz. Hurmat bilan, MASKON.`;
              
              // Simulating random SMS or Telegram type
              const type = Math.random() > 0.5 ? 'sms' : 'telegram';
              await pool.query(
                "INSERT INTO erp_notifications (type, recipient, message, status) VALUES ($1, $2, $3, 'sent')",
                [type, s.lead_phone, msg]
              );
              createdCount++;
            }
          }
        }
      }
    }

    // 2. Check Upcoming Meetings in 30 minutes (Sotuvchilar uchrashuviga 30 daqiqa qolganda)
    const upcomingMeetingsRes = await pool.query(`
      SELECT m.*, l.name as lead_name, u.name as seller_name, u.phone as seller_phone
      FROM erp_meetings m
      JOIN erp_leads l ON m.lead_id = l.id
      JOIN users u ON m.user_id = u.id
      WHERE m.status = 'scheduled'
    `);
    
    for (const m of upcomingMeetingsRes.rows) {
      const meetTime = new Date(m.scheduled_time);
      const diffMinutes = Math.round((meetTime.getTime() - now.getTime()) / (1000 * 60));
      
      // If meeting is starting in 0 to 30 minutes
      if (diffMinutes > 0 && diffMinutes <= 30) {
        // Check if alert already sent
        const alreadySent = await pool.query(
          "SELECT id FROM erp_notifications WHERE recipient = $1 AND message LIKE $2",
          [m.seller_name, `%Uchrashuv ID: ${m.id}%`]
        );
        
        if (alreadySent.rows.length === 0) {
          const msg = `Sotuvchi ${m.seller_name} uchun eslatma: 30 daqiqadan so'ng mijoz ${m.lead_name} bilan uchrashuvingiz bor. Manzil: ${m.location}. Eslatma vaqti: ${meetTime.toLocaleTimeString("uz-UZ", {hour: '2-digit', minute:'2-digit'})}. (Uchrashuv ID: ${m.id})`;
          
          await pool.query(
            "INSERT INTO erp_notifications (type, recipient, message, status) VALUES ('telegram', $1, $2, 'sent')",
            [m.seller_name, msg]
          );
          createdCount++;
        }
      }
    }

    // 3. Check Idle Leads (Javobsiz qolgan lidlar bo'yicha sotuvchilarga eslatma)
    // Idle: created > 24 hours ago, status in 'new'/'contacted', has assigned seller, NO meetings, NO tasks, NO notification sent in last 24 hours
    const idleLeadsRes = await pool.query(`
      SELECT l.*, u.name as seller_name, u.phone as seller_phone
      FROM erp_leads l
      JOIN users u ON l.assigned_to = u.id
      WHERE l.status IN ('new', 'contacted')
        AND l.created_at < NOW() - INTERVAL '24 hours'
        AND NOT EXISTS (SELECT 1 FROM erp_meetings WHERE lead_id = l.id)
        AND NOT EXISTS (SELECT 1 FROM erp_tasks WHERE lead_id = l.id)
    `);
    
    for (const l of idleLeadsRes.rows) {
      // Check if alert was sent in last 24 hours
      const alreadySent = await pool.query(
        `SELECT id FROM erp_notifications 
         WHERE recipient = $1 AND message LIKE $2 AND sent_at > NOW() - INTERVAL '24 hours'`,
        [l.seller_name, `%Lid ID: ${l.id}%`]
      );
      
      if (alreadySent.rows.length === 0) {
        const msg = `Sotuvchi ${l.seller_name} uchun ogohlantirish: Sizga biriktirilgan mijoz ${l.name} bo'yicha 24 soatdan beri hech qanday harakat bajarilmadi (uchrashuv yoki vazifa yo'q). Iltimos, mijoz bilan bog'laning. (Lid ID: ${l.id})`;
        
        await pool.query(
          "INSERT INTO erp_notifications (type, recipient, message, status) VALUES ('telegram', $1, $2, 'sent')",
          [l.seller_name, msg]
        );
        createdCount++;
      }
    }

    revalidatePath("/erp");
    return { success: true, createdCount };
  } catch (error) {
    console.error("erpCheckAndSendAutomaticNotifications error:", error);
    return { error: "Avtomatik tekshiruvda xatolik" };
  }
}

// 9. Client Portal Server Action
export async function erpGetClientContract(phone, contractId) {
  await initFeatureTables();
  try {
    const cleanPhone = phone.trim().replace(/[\s\-\(\)\+]/g, "");
    
    // Select sale details
    const { rows } = await pool.query(`
      SELECT s.*, 
             u.unit_number, u.floor, u.rooms, u.area, u.price as unit_original_price,
             p.id as project_id, p.name as project_name, p.location as project_location,
             p.start_date as project_start, p.end_date as project_end,
             p.progress_kotlovan, p.progress_brick, p.progress_facade, p.progress_interior,
             l.name as lead_name, l.phone as lead_phone
      FROM erp_sales s
      JOIN erp_units u ON s.unit_id = u.id
      JOIN erp_projects p ON u.project_id = p.id
      JOIN erp_leads l ON s.lead_id = l.id
      WHERE (
        l.phone = $1 OR 
        REPLACE(REPLACE(REPLACE(REPLACE(l.phone, ' ', ''), '-', ''), '(', ''), ')', '') = $1 OR
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(l.phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = $1 OR
        RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(l.phone, ' ', ''), '-', ''), '(', ''), ')', ''), 9) = RIGHT($1, 9)
      )
      AND (s.id = $2 OR u.unit_number = $3)
    `, [cleanPhone, parseInt(contractId) || -1, contractId]);

    if (rows.length === 0) {
      return { error: "Kiritilgan telefon raqami yoki shartnoma/xonadon raqami bo'yicha hech qanday faol shartnoma topilmadi!" };
    }
    
    return { success: true, contract: rows[0] };
  } catch (error) {
    console.error("erpGetClientContract error:", error);
    return { error: "Ma'lumotlarni yuklashda xatolik yuz berdi" };
  }
}


