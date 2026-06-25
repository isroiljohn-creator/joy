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
        agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- 'sms', 'telegram'
        recipient VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'sent',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Ensure agency_id column exists
    await pool.query(`
      ALTER TABLE erp_notifications ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE;
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
    // Check and release expired reservations dynamically (scoped by agency)
    await pool.query(`
      UPDATE erp_units 
      SET status = 'available', reserved_until = NULL, reserved_by = NULL 
      WHERE status = 'reserved' AND reserved_until < NOW() AND (agency_id = $1 OR (agency_id IS NULL AND $1 IS NULL));
    `, [user.agencyId]);

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

    // Get Units count (scoped by agency)
    const unitCountRes = await pool.query(`
      SELECT status, COUNT(*), SUM(price) as total_value
      FROM erp_units
      WHERE (agency_id = $1 OR (agency_id IS NULL AND $1 IS NULL))
      GROUP BY status
    `, [user.agencyId]);
    
    unitCountRes.rows.forEach(r => {
      const count = parseInt(r.count, 10);
      stats.totalUnits += count;
      if (r.status === 'available') stats.availableUnits = count;
      if (r.status === 'reserved') stats.reservedUnits = count;
      if (r.status === 'sold') stats.soldUnits = count;
    });

    // Get Leads statistics based on role (scoped by agency)
    let leadQuery = "SELECT status, COUNT(*) FROM erp_leads WHERE (agency_id = $1 OR (agency_id IS NULL AND $1 IS NULL))";
    let leadParams = [user.agencyId];
    if (user.role === 'seller') {
      leadQuery += " AND assigned_to = $2";
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

    // Meetings count (scheduled or completed) (scoped by agency)
    let meetingQuery = "SELECT COUNT(*) FROM erp_meetings m JOIN erp_leads l ON m.lead_id = l.id WHERE m.status = 'scheduled' AND (l.agency_id = $1 OR (l.agency_id IS NULL AND $1 IS NULL))";
    let meetingParams = [user.agencyId];
    if (user.role === 'seller') {
      meetingQuery += " AND l.assigned_to = $2";
      meetingParams.push(user.id);
    }
    const meetingCountRes = await pool.query(meetingQuery, meetingParams);
    stats.scheduledMeetings = parseInt(meetingCountRes.rows[0].count, 10);

    // Sales volume, cash in, and outstanding balance (scoped by agency)
    let salesQuery = `
      SELECT SUM(sold_price) as volume, 
             SUM(paid_amount) as cash, 
             SUM(sold_price - paid_amount) as outstanding 
      FROM erp_sales
      WHERE (agency_id = $1 OR (agency_id IS NULL AND $1 IS NULL))
    `;
    let salesParams = [user.agencyId];
    if (user.role === 'seller') {
      salesQuery += " AND sold_by = $2";
      salesParams.push(user.id);
    }
    const salesStatsRes = await pool.query(salesQuery, salesParams);
    stats.totalSalesVolume = parseInt(salesStatsRes.rows[0].volume || 0, 10);
    stats.totalCashIn = parseInt(salesStatsRes.rows[0].cash || 0, 10);
    stats.totalOutstanding = parseInt(salesStatsRes.rows[0].outstanding || 0, 10);

    // Additional data for ROP/Owner: Seller KPI performance (scoped by agency)
    let sellersPerformance = [];
    if (user.role === 'rop' || user.role === 'owner') {
      const perfRes = await pool.query(`
        SELECT u.id, u.name, 
               COUNT(DISTINCT l.id) as leads_count,
               COUNT(DISTINCT s.id) as sales_count,
               COALESCE(SUM(s.sold_price), 0) as sales_volume
        FROM users u
        LEFT JOIN erp_leads l ON l.assigned_to = u.id AND (l.agency_id = $1 OR (l.agency_id IS NULL AND $1 IS NULL))
        LEFT JOIN erp_sales s ON s.sold_by = u.id AND (s.agency_id = $1 OR (s.agency_id IS NULL AND $1 IS NULL))
        WHERE u.role = 'seller' AND (u.agency_id = $1 OR (u.agency_id IS NULL AND $1 IS NULL))
        GROUP BY u.id, u.name
        ORDER BY sales_volume DESC
      `, [user.agencyId]);
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
  const user = await verifyAccess();
  try {
    const { rows } = await pool.query(`
      SELECT p.*, 
             COUNT(u.id) as total_units,
             COUNT(CASE WHEN u.status = 'available' THEN 1 END) as available_units,
             COUNT(CASE WHEN u.status = 'reserved' THEN 1 END) as reserved_units,
             COUNT(CASE WHEN u.status = 'sold' THEN 1 END) as sold_units
      FROM erp_projects p
      LEFT JOIN erp_units u ON u.project_id = p.id
      WHERE (p.agency_id = $1 OR (p.agency_id IS NULL AND $1 IS NULL))
      GROUP BY p.id
      ORDER BY p.id DESC
    `, [user.agencyId]);
    return rows;
  } catch (error) {
    console.error("erpGetProjects error:", error);
    return [];
  }
}

export async function erpAddProject(formData) {
  const user = await verifyAccess(["owner", "rop"]);
  const name = formData.get("name");
  const description = formData.get("description");
  const location = formData.get("location");
  const budget = parseInt(formData.get("budget")) || 0;
  const start_date = formData.get("start_date");
  const end_date = formData.get("end_date");

  try {
    await pool.query(
      `INSERT INTO erp_projects (name, description, location, budget, status, start_date, end_date, agency_id)
       VALUES ($1, $2, $3, $4, 'planning', $5, $6, $7)`,
      [name, description, location, budget, start_date || null, end_date || null, user.agencyId]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpAddProject error:", error);
    return { error: "Loyihani yaratishda xatolik yuz berdi" };
  }
}

export async function erpUpdateProjectProgress(projectId, stages = {}) {
  const user = await verifyAccess(["owner", "rop"]);
  const { kotlovan = 0, brick = 0, facade = 0, interior = 0 } = stages || {};
  try {
    const { rowCount } = await pool.query(
      `UPDATE erp_projects 
       SET progress_kotlovan = $1, progress_brick = $2, progress_facade = $3, progress_interior = $4
       WHERE id = $5 AND (agency_id = $6 OR (agency_id IS NULL AND $6 IS NULL))`,
      [
        parseInt(kotlovan) || 0,
        parseInt(brick) || 0,
        parseInt(facade) || 0,
        parseInt(interior) || 0,
        projectId,
        user.agencyId
      ]
    );
    if (rowCount === 0) {
      return { error: "Loyiha topilmadi yoki ruxsat yo'q" };
    }
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpUpdateProjectProgress error:", error);
    return { error: "Loyihani yangilashda xatolik" };
  }
}

export async function erpGetUnits(projectId) {
  const user = await verifyAccess();
  try {
    // Auto-update expired reservations before returning units (scoped by agency)
    await pool.query(`
      UPDATE erp_units 
      SET status = 'available', reserved_until = NULL, reserved_by = NULL 
      WHERE status = 'reserved' AND reserved_until < NOW() AND (agency_id = $1 OR (agency_id IS NULL AND $1 IS NULL));
    `, [user.agencyId]);

    const { rows } = await pool.query(
      `SELECT u.*, us.name as seller_name 
       FROM erp_units u
       LEFT JOIN users us ON u.reserved_by = us.id
       WHERE u.project_id = $1 AND (u.agency_id = $2 OR (u.agency_id IS NULL AND $2 IS NULL))
       ORDER BY u.floor DESC, u.unit_number ASC`,
      [projectId, user.agencyId]
    );
    return rows;
  } catch (error) {
    console.error("erpGetUnits error:", error);
    return [];
  }
}

export async function erpAddUnit(formData) {
  const user = await verifyAccess(["owner", "rop"]);
  const projectId = parseInt(formData.get("project_id"));
  const unitNumber = formData.get("unit_number");
  const floor = parseInt(formData.get("floor")) || 1;
  const area = parseFloat(formData.get("area")) || 0;
  const rooms = parseInt(formData.get("rooms")) || 1;
  const price = parseInt(formData.get("price")) || 0;

  try {
    // Loyiha joriy foydalanuvchi agentligiga tegishlimi tekshiramiz
    const { rows: projRows } = await pool.query(
      "SELECT id FROM erp_projects WHERE id = $1 AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))",
      [projectId, user.agencyId]
    );
    if (projRows.length === 0) {
      return { error: "Loyiha topilmadi yoki ruxsat yo'q" };
    }

    await pool.query(
      `INSERT INTO erp_units (project_id, unit_number, floor, area, rooms, price, status, agency_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'available', $7)`,
      [projectId, unitNumber, floor, area, rooms, price, user.agencyId]
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
      WHERE (l.agency_id = $1 OR (l.agency_id IS NULL AND $1 IS NULL))
    `;
    let params = [user.agencyId];
    if (user.role === 'seller') {
      query += " AND l.assigned_to = $2";
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
      `INSERT INTO erp_leads (name, phone, email, source, status, budget, notes, assigned_to, agency_id)
       VALUES ($1, $2, $3, $4, 'new', $5, $6, $7, $8)`,
      [name, phone, email, source, budget, notes, assigned_to, user.agencyId]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpAddLead error:", error);
    return { error: "Mijoz qo'shishda xatolik yuz berdi" };
  }
}

export async function erpAssignLeadToSeller(leadId, sellerId) {
  const user = await verifyAccess(["owner", "rop"]);
  const targetSellerId = sellerId ? parseInt(sellerId) : null;
  try {
    // Check if lead belongs to agency
    const { rows: leadRows } = await pool.query(
      "SELECT id FROM erp_leads WHERE id = $1 AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))",
      [leadId, user.agencyId]
    );
    if (leadRows.length === 0) {
      return { error: "Mijoz topilmadi yoki ruxsat yo'q" };
    }

    // If targetSellerId is not null, check if seller belongs to agency
    if (targetSellerId !== null) {
      const { rows: sellerRows } = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'seller' AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))",
        [targetSellerId, user.agencyId]
      );
      if (sellerRows.length === 0) {
        return { error: "Sotuvchi topilmadi yoki ushbu agentlikka tegishli emas!" };
      }
    }

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
    const { rows } = await pool.query(
      "SELECT assigned_to FROM erp_leads WHERE id = $1 AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))",
      [leadId, user.agencyId]
    );
    if (rows.length === 0) {
      return { error: "Mijoz topilmadi yoki ruxsat yo'q!" };
    }
    if (user.role === 'seller' && rows[0].assigned_to !== user.id) {
      return { error: "Ushbu mijoz sizga biriktirilmagan!" };
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
      WHERE (m.agency_id = $1 OR (m.agency_id IS NULL AND $1 IS NULL))
    `;
    let params = [user.agencyId];
    if (user.role === 'seller') {
      query += " AND m.user_id = $2";
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
    // 1. Check if lead belongs to agency
    const { rows: leadRows } = await pool.query(
      "SELECT id, assigned_to FROM erp_leads WHERE id = $1 AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))",
      [leadId, user.agencyId]
    );
    if (leadRows.length === 0) {
      return { error: "Mijoz topilmadi yoki ruxsat yo'q" };
    }
    const lead = leadRows[0];

    // 2. Check if seller belongs to agency
    const { rows: sellerRows } = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))",
      [assignedSellerId, user.agencyId]
    );
    if (sellerRows.length === 0) {
      return { error: "Sotuvchi topilmadi yoki ruxsat yo'q" };
    }

    if (user.role === 'seller' && lead.assigned_to !== user.id) {
      return { error: "Ushbu mijoz sizga biriktirilmagan!" };
    }

    await pool.query("BEGIN");

    // Add meeting
    await pool.query(
      `INSERT INTO erp_meetings (lead_id, user_id, scheduled_time, location, notes, status, agency_id)
       VALUES ($1, $2, $3, $4, $5, 'scheduled', $6)`,
      [leadId, assignedSellerId, scheduledTime, location, notes, user.agencyId]
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
    const { rows } = await pool.query(
      "SELECT user_id FROM erp_meetings WHERE id = $1 AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))",
      [meetingId, user.agencyId]
    );
    if (rows.length === 0) {
      return { error: "Uchrashuv topilmadi yoki ruxsat yo'q!" };
    }
    if (user.role === 'seller' && rows[0].user_id !== user.id) {
      return { error: "Ushbu uchrashuv sizga tegishli emas!" };
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
      WHERE (s.agency_id = $1 OR (s.agency_id IS NULL AND $1 IS NULL))
    `;
    let params = [user.agencyId];
    if (user.role === 'seller') {
      query += " AND s.sold_by = $2";
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
    // 1. Verify unit belongs to agency
    const { rows: unitCheck } = await pool.query(
      "SELECT status, agency_id FROM erp_units WHERE id = $1",
      [unitId]
    );
    if (unitCheck.length === 0) {
      return { error: "Xonadon topilmadi" };
    }
    if (unitCheck[0].agency_id !== user.agencyId) {
      return { error: "Ushbu xonadonga ruxsatingiz yo'q!" };
    }

    // 2. Verify lead belongs to agency (if provided)
    if (leadId) {
      const { rows: leadCheck } = await pool.query(
        "SELECT agency_id, assigned_to FROM erp_leads WHERE id = $1",
        [leadId]
      );
      if (leadCheck.length === 0 || leadCheck[0].agency_id !== user.agencyId) {
        return { error: "Mijoz topilmadi yoki ruxsat yo'q!" };
      }
      if (user.role === 'seller' && leadCheck[0].assigned_to !== user.id) {
        return { error: "Ushbu mijoz sizga biriktirilmagan!" };
      }
    }

    // 3. Verify seller belongs to agency
    const { rows: sellerCheck } = await pool.query(
      "SELECT agency_id FROM users WHERE id = $1",
      [resBy]
    );
    if (sellerCheck.length === 0 || sellerCheck[0].agency_id !== user.agencyId) {
      return { error: "Sotuvchiga ruxsat yo'q!" };
    }

    await pool.query("BEGIN");
    
    if (!expiresAt) {
      // Clearing/cancelling reservation
      await pool.query(
        `UPDATE erp_units 
         SET status = 'available', reserved_until = NULL, reserved_by = NULL 
         WHERE id = $1`,
        [unitId]
      );
    } else {
      // 1. Fetch unit's listing_id and delete listing if any (since it's now reserved and not available)
      const { rows: unitRows } = await pool.query(
        `SELECT listing_id FROM erp_units WHERE id = $1`,
        [unitId]
      );
      if (unitRows.length > 0 && unitRows[0].listing_id) {
        const listingId = unitRows[0].listing_id;
        await pool.query("UPDATE listings SET deleted_at = NOW() WHERE id = $1", [listingId]);
      }

      // 2. Update unit status to reserved and clear listing_id
      const res = await pool.query(
        `UPDATE erp_units 
         SET status = 'reserved', reserved_until = $1, reserved_by = $2, listing_id = NULL 
         WHERE id = $3 AND status = 'available'`,
        [expiresAt, resBy, unitId]
      );

      if (res.rowCount === 0) {
        throw new Error("Xonadon allaqachon band qilingan yoki sotilgan!");
      }

      // 3. Update lead status to negotiation if it is not won/lost
      if (leadId) {
        await pool.query(
          "UPDATE erp_leads SET status = 'negotiation' WHERE id = $1 AND status NOT IN ('won', 'lost')",
          [leadId]
        );
      }
    }

    await pool.query("COMMIT");
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("erpReserveUnit error:", error);
    return { error: error.message || "Xonadonni band qilishda xatolik" };
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

  if (soldPrice <= 0 || initialPayment < 0 || paidAmount < 0) {
    return { error: "Moliyaviy summalarni manfiy yoki nol bo'lishi taqiqlanadi!" };
  }

  try {
    // 1. Verify unit belongs to agency
    const { rows: unitRows } = await pool.query(
      "SELECT agency_id FROM erp_units WHERE id = $1",
      [unitId]
    );
    if (unitRows.length === 0 || unitRows[0].agency_id !== user.agencyId) {
      return { error: "Xonadon topilmadi yoki ruxsat yo'q!" };
    }

    // 2. Verify lead belongs to agency
    const { rows: leadRows } = await pool.query(
      "SELECT agency_id, assigned_to FROM erp_leads WHERE id = $1",
      [leadId]
    );
    if (leadRows.length === 0 || leadRows[0].agency_id !== user.agencyId) {
      return { error: "Mijoz topilmadi yoki ruxsat yo'q!" };
    }
    if (user.role === 'seller' && leadRows[0].assigned_to !== user.id) {
      return { error: "Ushbu mijoz sizga biriktirilmagan!" };
    }

    // 3. Verify seller belongs to agency
    const { rows: sellerRows } = await pool.query(
      "SELECT agency_id FROM users WHERE id = $1",
      [soldBy]
    );
    if (sellerRows.length === 0 || sellerRows[0].agency_id !== user.agencyId) {
      return { error: "Sotuvchi topilmadi yoki ruxsat yo'q!" };
    }

    await pool.query("BEGIN");

    // 0. Check and lock unit status to prevent double-selling
    const { rows: unitCheck } = await pool.query(
      "SELECT status FROM erp_units WHERE id = $1 FOR UPDATE",
      [unitId]
    );
    if (unitCheck.length === 0) {
      throw new Error("Xonadon topilmadi");
    }
    if (unitCheck[0].status === "sold") {
      throw new Error("Ushbu xonadon allaqachon sotilgan!");
    }

    // 1. Insert into erp_sales
    await pool.query(
      `INSERT INTO erp_sales (unit_id, lead_id, sold_price, payment_plan, initial_payment, paid_amount, status, sold_by, agency_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [unitId, leadId, soldPrice, paymentPlan, initialPayment, paidAmount, paymentPlan === 'cash' ? 'completed' : 'active', soldBy, user.agencyId]
    );

    // 2. Fetch unit's listing_id and delete listing if any
    const { rows: unitRowsListing } = await pool.query(
      `SELECT listing_id FROM erp_units WHERE id = $1`,
      [unitId]
    );
    if (unitRowsListing.length > 0 && unitRowsListing[0].listing_id) {
      const listingId = unitRowsListing[0].listing_id;
      await pool.query("UPDATE listings SET deleted_at = NOW() WHERE id = $1", [listingId]);
    }

    // 3. Update erp_units status to sold and clear listing_id
    await pool.query(
      `UPDATE erp_units SET status = 'sold', reserved_until = NULL, reserved_by = NULL, listing_id = NULL WHERE id = $1`,
      [unitId]
    );

    // 4. Update erp_leads status to won
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
    return { error: error.message || "Sotuvni rasmiylashtirishda xatolik yuz berdi" };
  }
}

export async function erpRecordPayment(saleId, amount) {
  const user = await verifyAccess(["owner", "rop"]);
  const paymentAmount = parseInt(amount) || 0;

  if (paymentAmount <= 0) {
    return { error: "To'lov summasi noldan katta bo'lishi kerak" };
  }

  try {
    const { rows: saleRows } = await pool.query(
      "SELECT agency_id, sold_price, paid_amount, status FROM erp_sales WHERE id = $1",
      [saleId]
    );
    if (saleRows.length === 0 || saleRows[0].agency_id !== user.agencyId) {
      return { error: "Sotuv topilmadi yoki ruxsat yo'q!" };
    }
    const sale = saleRows[0];
    if (sale.status === 'completed' || sale.status === 'cancelled') {
      return { error: "Ushbu shartnoma bo'yicha to'lov qabul qilib bo'lmaydi (shartnoma yopilgan yoki bekor qilingan)!" };
    }

    const remaining = parseInt(sale.sold_price) - parseInt(sale.paid_amount);
    if (paymentAmount > remaining) {
      return { error: `To'lov summasi qolgan qarzdan oshib ketdi! Qolgan qarz: $${remaining.toLocaleString()}` };
    }

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
  const user = await verifyAccess();
  try {
    const { rows } = await pool.query(
      "SELECT id, name, phone, role FROM users WHERE (role = 'seller' OR role = 'rop') AND (agency_id = $1 OR (agency_id IS NULL AND $1 IS NULL)) ORDER BY name ASC",
      [user.agencyId]
    );
    return rows;
  } catch (error) {
    console.error("erpGetSellers error:", error);
    return [];
  }
}

export async function erpGetAllStaff() {
  const user = await verifyAccess(["owner"]);
  try {
    const { rows } = await pool.query(
      "SELECT id, name, phone, role, created_at FROM users WHERE role IN ('owner', 'rop', 'seller') AND (agency_id = $1 OR (agency_id IS NULL AND $1 IS NULL)) ORDER BY id ASC",
      [user.agencyId]
    );
    return rows;
  } catch (error) {
    console.error("erpGetAllStaff error:", error);
    return [];
  }
}

export async function erpUpdateUserRole(targetUserId, newRole) {
  const user = await verifyAccess(["owner"]);
  try {
    const { rows } = await pool.query(
      "SELECT agency_id FROM users WHERE id = $1",
      [targetUserId]
    );
    if (rows.length === 0 || rows[0].agency_id !== user.agencyId) {
      return { error: "Foydalanuvchi topilmadi yoki ushbu agentlikka tegishli emas!" };
    }
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
  const user = await verifyAccess(["owner", "rop"]);
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM erp_projects WHERE id = $1 AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))",
      [projectId, user.agencyId]
    );
    if (rowCount === 0) {
      return { error: "Loyiha topilmadi yoki ruxsat yo'q!" };
    }
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpDeleteProject error:", error);
    return { error: "Loyihani o'chirishda xatolik yuz berdi" };
  }
}

// 7. Task Management (To-Do List) Actions
export async function erpGetTasks(leadId) {
  const user = await verifyAccess();
  try {
    const { rows: leadCheck } = await pool.query(
      "SELECT assigned_to FROM erp_leads WHERE id = $1 AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))",
      [leadId, user.agencyId]
    );
    if (leadCheck.length === 0) {
      return [];
    }
    if (user.role === 'seller' && leadCheck[0].assigned_to !== user.id) {
      return [];
    }

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
  const user = await verifyAccess();
  try {
    const { rows: leadCheck } = await pool.query(
      "SELECT assigned_to FROM erp_leads WHERE id = $1 AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))",
      [leadId, user.agencyId]
    );
    if (leadCheck.length === 0) {
      return { error: "Mijoz topilmadi yoki ruxsat yo'q!" };
    }
    if (user.role === 'seller' && leadCheck[0].assigned_to !== user.id) {
      return { error: "Ushbu mijoz sizga biriktirilmagan, shuning uchun vazifa qo'sha olmaysiz!" };
    }

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
  const user = await verifyAccess();
  try {
    const { rows: taskCheck } = await pool.query(
      `SELECT t.id, l.assigned_to FROM erp_tasks t
       JOIN erp_leads l ON t.lead_id = l.id
       WHERE t.id = $1 AND (l.agency_id = $2 OR (l.agency_id IS NULL AND $2 IS NULL))`,
      [taskId, user.agencyId]
    );
    if (taskCheck.length === 0) {
      return { error: "Vazifa topilmadi yoki ruxsat yo'q!" };
    }
    if (user.role === 'seller' && taskCheck[0].assigned_to !== user.id) {
      return { error: "Ushbu vazifani o'zgartirishga ruxsatingiz yo'q!" };
    }

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
  const user = await verifyAccess();
  try {
    const { rows: taskCheck } = await pool.query(
      `SELECT t.id, l.assigned_to FROM erp_tasks t
       JOIN erp_leads l ON t.lead_id = l.id
       WHERE t.id = $1 AND (l.agency_id = $2 OR (l.agency_id IS NULL AND $2 IS NULL))`,
      [taskId, user.agencyId]
    );
    if (taskCheck.length === 0) {
      return { error: "Vazifa topilmadi yoki ruxsat yo'q!" };
    }
    if (user.role === 'seller' && taskCheck[0].assigned_to !== user.id) {
      return { error: "Ushbu vazifani o'chirishga ruxsatingiz yo'q!" };
    }

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
  const user = await verifyAccess();
  try {
    const { rows } = await pool.query(
      "SELECT * FROM erp_notifications WHERE (agency_id = $1 OR (agency_id IS NULL AND $1 IS NULL)) ORDER BY sent_at DESC LIMIT 50",
      [user.agencyId]
    );
    return rows;
  } catch (error) {
    console.error("erpGetNotifications error:", error);
    return [];
  }
}

export async function erpSendManualNotification(type, recipient, message) {
  const user = await verifyAccess();
  try {
    await pool.query(
      "INSERT INTO erp_notifications (type, recipient, message, status, agency_id) VALUES ($1, $2, $3, 'sent', $4)",
      [type, recipient, message, user.agencyId]
    );
    revalidatePath("/erp");
    return { success: true };
  } catch (error) {
    console.error("erpSendManualNotification error:", error);
    return { error: "Eslatma yuborishda xatolik" };
  }
}

function toUzbekistanParts(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  return {
    year: parseInt(map.year),
    month: parseInt(map.month) - 1, // 0-indexed month
    day: parseInt(map.day),
    hour: parseInt(map.hour),
    minute: parseInt(map.minute),
    second: parseInt(map.second)
  };
}

export async function erpCheckAndSendAutomaticNotifications() {
  const user = await verifyAccess();
  let createdCount = 0;
  const now = new Date();
  const nowUz = toUzbekistanParts(now);
  
  try {
    // 1. Check Installments due in 3 days (Mijozlar to'lov grafigiga 3 kun qolganda)
    const activeSalesRes = await pool.query(`
      SELECT s.*, l.name as lead_name, l.phone as lead_phone, p.name as project_name, u.unit_number
      FROM erp_sales s
      JOIN erp_leads l ON s.lead_id = l.id
      JOIN erp_units u ON s.unit_id = u.id
      JOIN erp_projects p ON u.project_id = p.id
      WHERE s.payment_plan = 'installments' AND s.status = 'active' AND (s.agency_id = $1 OR (s.agency_id IS NULL AND $1 IS NULL))
    `, [user.agencyId]);
    
    for (const s of activeSalesRes.rows) {
      const soldAtParts = toUzbekistanParts(new Date(s.sold_at));
      const totalAmount = parseInt(s.sold_price);
      const initPayment = parseInt(s.initial_payment);
      const monthlyInstallment = Math.round((totalAmount - initPayment) / 12);
      
      for (let i = 1; i <= 12; i++) {
        // Due Date = soldAt + i months in Tashkent time
        const dueYear = soldAtParts.year + Math.floor((soldAtParts.month + i) / 12);
        const dueMonth = (soldAtParts.month + i) % 12;
        const dueDay = soldAtParts.day;
        
        const d1 = new Date(Date.UTC(dueYear, dueMonth, dueDay));
        const d2 = new Date(Date.UTC(nowUz.year, nowUz.month, nowUz.day));
        const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
        
        // If due date is in exactly 3 days
        if (diffDays === 3) {
          const neededCumulative = initPayment + i * monthlyInstallment;
          if (parseInt(s.paid_amount) < neededCumulative) {
            // Check if reminder was already sent for this due date
            const dateStr = `${String(dueDay).padStart(2, '0')}.${String(dueMonth + 1).padStart(2, '0')}.${dueYear}`;
            const alreadySent = await pool.query(
              "SELECT id FROM erp_notifications WHERE recipient = $1 AND message LIKE $2 AND (agency_id = $3 OR (agency_id IS NULL AND $3 IS NULL))",
              [s.lead_phone, `%${dateStr}%`, user.agencyId]
            );
            
            if (alreadySent.rows.length === 0) {
              const msg = `Hurmatli ${s.lead_name}! Sizning "${s.project_name}" loyihasidagi ${s.unit_number}-xonadon uchun shartnoma bo'yicha ${i}-sonli to'lov muddati yaqinlashmoqda. To'lov sanasi: ${dateStr}. Kutilayotgan summa: $${monthlyInstallment.toLocaleString()}. Iltimos, to'lovni kiritishingizni so'raymiz. Hurmat bilan, MASKON.`;
              
              // Simulating random SMS or Telegram type
              const type = Math.random() > 0.5 ? 'sms' : 'telegram';
              await pool.query(
                "INSERT INTO erp_notifications (type, recipient, message, status, agency_id) VALUES ($1, $2, $3, 'sent', $4)",
                [type, s.lead_phone, msg, user.agencyId]
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
      WHERE m.status = 'scheduled' AND (m.agency_id = $1 OR (m.agency_id IS NULL AND $1 IS NULL))
    `, [user.agencyId]);
    
    for (const m of upcomingMeetingsRes.rows) {
      const meetTime = new Date(m.scheduled_time);
      const diffMinutes = Math.round((meetTime.getTime() - now.getTime()) / (1000 * 60));
      
      // If meeting is starting in 0 to 30 minutes
      if (diffMinutes > 0 && diffMinutes <= 30) {
        // Check if alert already sent
        const alreadySent = await pool.query(
          "SELECT id FROM erp_notifications WHERE recipient = $1 AND message LIKE $2 AND (agency_id = $3 OR (agency_id IS NULL AND $3 IS NULL))",
          [m.seller_name, `%Uchrashuv ID: ${m.id}%`, user.agencyId]
        );
        
        if (alreadySent.rows.length === 0) {
          const meetTimeStr = new Intl.DateTimeFormat("uz-UZ", {
            timeZone: "Asia/Tashkent",
            hour: "2-digit",
            minute: "2-digit"
          }).format(meetTime);
          const msg = `Sotuvchi ${m.seller_name} uchun eslatma: 30 daqiqadan so'ng mijoz ${m.lead_name} bilan uchrashuvingiz bor. Manzil: ${m.location}. Eslatma vaqti: ${meetTimeStr}. (Uchrashuv ID: ${m.id})`;
          
          await pool.query(
            "INSERT INTO erp_notifications (type, recipient, message, status, agency_id) VALUES ('telegram', $1, $2, 'sent', $3)",
            [m.seller_name, msg, user.agencyId]
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
        AND (l.agency_id = $1 OR (l.agency_id IS NULL AND $1 IS NULL))
    `, [user.agencyId]);
    
    for (const l of idleLeadsRes.rows) {
      // Check if alert was sent in last 24 hours
      const alreadySent = await pool.query(
        `SELECT id FROM erp_notifications 
         WHERE recipient = $1 AND message LIKE $2 AND sent_at > NOW() - INTERVAL '24 hours' AND (agency_id = $3 OR (agency_id IS NULL AND $3 IS NULL))`,
        [l.seller_name, `%Lid ID: ${l.id}%`, user.agencyId]
      );
      
      if (alreadySent.rows.length === 0) {
        const msg = `Sotuvchi ${l.seller_name} uchun ogohlantirish: Sizga biriktirilgan mijoz ${l.name} bo'yicha 24 soatdan beri hech qanday harakat bajarilmadi (uchrashuv yoki vazifa yo'q). Iltimos, mijoz bilan bog'laning. (Lid ID: ${l.id})`;
        
        await pool.query(
          "INSERT INTO erp_notifications (type, recipient, message, status, agency_id) VALUES ('telegram', $1, $2, 'sent', $3)",
          [l.seller_name, msg, user.agencyId]
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

    if (!phone || cleanPhone.length < 9) {
      return { error: "Telefon raqami noto'g'ri kiritilgan!" };
    }
    
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
      return { error: "Kiritilgan telefon raqami va shartnoma/xonadon raqami bo'yicha hech qanday faol shartnoma topilmadi!" };
    }

    const c = rows[0];
    const cleanLeadPhone = c.lead_phone.trim().replace(/[\s\-\(\)\+]/g, "");
    
    // Yana bir marta qo'shimcha xavfsizlik tekshiruvi: telefon raqami mos kelishi shart
    if (cleanLeadPhone !== cleanPhone && !cleanLeadPhone.endsWith(cleanPhone) && !cleanPhone.endsWith(cleanLeadPhone)) {
      return { error: "Telefon raqami mos kelmadi!" };
    }
    
    return { success: true, contract: c };
  } catch (error) {
    console.error("erpGetClientContract error:", error);
    return { error: "Ma'lumotlarni yuklashda xatolik yuz berdi" };
  }
}

export async function erpPublishUnitAsListing(unitId) {
  const user = await verifyAccess(["owner", "rop"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Fetch unit and project details
    const { rows: unitRows } = await client.query(
      `SELECT u.*, p.name as project_name, p.location as project_location 
       FROM erp_units u
       JOIN erp_projects p ON u.project_id = p.id
       WHERE u.id = $1 AND (u.agency_id = $2 OR (u.agency_id IS NULL AND $2 IS NULL))`,
      [unitId, user.agencyId]
    );
    
    if (unitRows.length === 0) {
      throw new Error("Xonadon topilmadi");
    }
    
    const unit = unitRows[0];
    if (unit.status !== "available") {
      throw new Error("Faqat bo'sh turgan (available) xonadonlarni ommaviy platformaga chiqarish mumkin!");
    }
    
    if (unit.listing_id) {
      throw new Error("Ushbu xonadon allaqachon platformada e'lon qilingan!");
    }
    
    const priceNum = parseInt(unit.price) || 0;
    const priceFormatted = "$" + String(priceNum).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const title = `${unit.rooms} xonali kvartira`;
    const photo = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=75";
    const desc = `${unit.project_name} turar joy majmuasida joylashgan yangi ${unit.rooms} xonali shinam xonadon sotuvga qo'yildi. Umumiy maydon: ${unit.area} m², Qavat: ${unit.floor}-qavat. Batafsil ma'lumot olish uchun biz bilan bog'laning.`;
    
    // Insert into listings
    const { rows: listingRows } = await client.query(
      `INSERT INTO listings (
        price, price_num, type, cat, addr, rooms, baths, area, floor, top, 
        photo, owner_id, agency_id, views, saves, status, pin_x, pin_y, description, 
        phone, has_mortgage, has_cadastre_verified
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING id`,
      [
        priceFormatted, priceNum, title, "Yangi uylar", unit.project_location, 
        unit.rooms, 1, unit.area, String(unit.floor), false,
        photo, user.id, user.agencyId, 0, 0, "active", 150, 150, desc, 
        user.phone || "+998 90 123 45 67", true, false
      ]
    );
    
    const listingId = listingRows[0].id;
    
    // Update unit with listing_id
    await client.query(
      `UPDATE erp_units SET listing_id = $1 WHERE id = $2`,
      [listingId, unitId]
    );
    
    await client.query("COMMIT");
    revalidatePath("/erp");
    revalidatePath("/listings");
    revalidatePath("/");
    return { success: true, listingId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("erpPublishUnitAsListing error:", error);
    return { error: error.message || "E'lonni platformaga nashr qilishda xatolik yuz berdi" };
  } finally {
    client.release();
  }
}

export async function erpUnpublishUnitAsListing(unitId) {
  const user = await verifyAccess(["owner", "rop"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { rows: unitRows } = await client.query(
      `SELECT listing_id FROM erp_units WHERE id = $1 AND (agency_id = $2 OR (agency_id IS NULL AND $2 IS NULL))`,
      [unitId, user.agencyId]
    );
    
    if (unitRows.length === 0) {
      throw new Error("Xonadon topilmadi");
    }
    
    const listingId = unitRows[0].listing_id;
    if (!listingId) {
      throw new Error("Xonadon platformada nashr qilinmagan!");
    }
    
    // Delete from listings (soft delete)
    await client.query("UPDATE listings SET deleted_at = NOW() WHERE id = $1", [listingId]);
    
    // Clear listing_id in erp_units
    await client.query("UPDATE erp_units SET listing_id = NULL WHERE id = $1", [unitId]);
    
    await client.query("COMMIT");
    revalidatePath("/erp");
    revalidatePath("/listings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("erpUnpublishUnitAsListing error:", error);
    return { error: error.message || "E'lonni platformadan o'chirishda xatolik yuz berdi" };
  } finally {
    client.release();
  }
}

// ERP Onboarding: Yangi kompaniya va loyiha yaratish
export async function erpSetupAction({ companyName, companyPhone, companyAddress, projectName, projectLocation, projectBudget, plan }) {
  const user = await getCurrentUser();
  if (!user) return { error: "Tizimga kiring" };

  // Agar allaqachon ERP roli bo'lsa, qayta o'rnatmaylik
  const allowedRoles = ["owner", "rop", "seller"];
  if (allowedRoles.includes(user.role)) {
    return { error: "Siz allaqachon ERP tizimiga ulangansiz" };
  }

  const validPlans = ["starter", "pro", "enterprise"];
  if (!plan || !validPlans.includes(plan)) {
    return { error: "Iltimos, tarif turini tanlang" };
  }

  if (!companyName?.trim()) return { error: "Kompaniya nomi majburiy" };
  if (!projectName?.trim()) return { error: "Loyiha nomi majburiy" };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Agentlik yaratish
    const slug = companyName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 100) + "-" + user.id;

    const { rows: agencyRows } = await client.query(
      `INSERT INTO agencies (name, slug, phone, address, owner_id, listing_quota, created_at)
       VALUES ($1, $2, $3, $4, $5, 200, NOW())
       RETURNING id`,
      [companyName.trim(), slug, companyPhone || null, companyAddress || null, user.id]
    );
    const agencyId = agencyRows[0].id;

    // 2. Foydalanuvchiga 'owner' roli, agency_id va subscription_plan berish
    await client.query(
      "UPDATE users SET role = 'owner', agency_id = $1, subscription_plan = $2 WHERE id = $3",
      [agencyId, plan, user.id]
    );

    // 3. Birinchi loyihani yaratish
    await client.query(
      `INSERT INTO erp_projects (name, location, budget, status, agency_id)
       VALUES ($1, $2, $3, 'planning', $4)`,
      [
        projectName.trim(),
        projectLocation || null,
        projectBudget ? parseInt(projectBudget) : null,
        agencyId
      ]
    );

    await client.query("COMMIT");
    revalidatePath("/erp");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("erpSetupAction error:", error);
    if (error.code === "23505") {
      return { error: "Bu kompaniya nomi band, boshqa nom tanlang" };
    }
    return { error: "Xatolik yuz berdi, qaytadan urinib ko'ring" };
  } finally {
    client.release();
  }
}
