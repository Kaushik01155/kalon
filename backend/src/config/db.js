import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;
let useMemory = process.env.USE_MEMORY_DB === 'true' || Boolean(process.env.VERCEL);

const memoryDb = {
  users: [
    { id: 1, phone: '9999999999', name: 'Admin User', email: 'admin@kalon.app', role: 'admin', is_verified: true, created_at: new Date().toISOString() },
    { id: 2, phone: '8888888888', name: 'Volunteer One', email: 'volunteer@kalon.app', role: 'volunteer', is_verified: true, created_at: new Date().toISOString() },
    { id: 3, phone: '7777777777', name: 'Demo Customer', email: 'customer@kalon.app', role: 'customer', is_verified: true, created_at: new Date().toISOString() },
  ],
  otp_codes: [],
  vehicles: [],
  service_types: [
    { id: 1, slug: 'fuel_delivery', name: 'Fuel Delivery', description: 'Emergency fuel delivery to your location', base_price: 499, icon: 'fuel', is_active: true },
    { id: 2, slug: 'tyre_puncture', name: 'Tyre Puncture', description: 'On-spot puncture repair and tyre change', base_price: 399, icon: 'tyre', is_active: true },
    { id: 3, slug: 'battery_jump', name: 'Battery Jump Start', description: 'Jump start service for dead batteries', base_price: 349, icon: 'battery', is_active: true },
    { id: 4, slug: 'towing', name: 'Towing Service', description: 'Vehicle towing to nearest service center', base_price: 999, icon: 'tow', is_active: true },
  ],
  assistance_requests: [],
  request_tracking: [],
  volunteer_profiles: [
    { id: 1, user_id: 2, is_available: true, current_latitude: 28.6139, current_longitude: 77.2090, rating: 5, total_jobs: 0, services_offered: '["fuel_delivery","tyre_puncture","battery_jump","towing"]' },
  ],
  payments: [],
  _nextId: { users: 4, otp_codes: 1, vehicles: 1, assistance_requests: 1, request_tracking: 1, payments: 1 },
};

function memoryQuery(sql, params = []) {
  const s = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  if (s.startsWith('insert into otp_codes')) {
    const row = { id: memoryDb._nextId.otp_codes++, phone: params[0], code: params[1], expires_at: params[2], used: false, created_at: new Date() };
    memoryDb.otp_codes.push(row);
    return [{ insertId: row.id }];
  }

  if (s.includes('from otp_codes where phone') && s.includes('code =')) {
    const rows = memoryDb.otp_codes.filter(
      (o) => o.phone === params[0] && o.code === params[1] && !o.used && new Date(o.expires_at) > new Date()
    );
    return [rows.sort((a, b) => b.id - a.id).slice(0, 1)];
  }

  if (s.startsWith('update otp_codes set used')) {
    const o = memoryDb.otp_codes.find((x) => x.id === params[0]);
    if (o) o.used = true;
    return [{ affectedRows: 1 }];
  }

  if (s.includes('from users where phone')) {
    return [memoryDb.users.filter((u) => u.phone === params[0])];
  }

  if (s.includes('from users where id')) {
    return [memoryDb.users.filter((u) => u.id === params[0])];
  }

  if (s.startsWith('insert into users')) {
    const id = memoryDb._nextId.users++;
    const row = { id, phone: params[0], name: params[1], role: params[2], is_verified: true, email: null, created_at: new Date().toISOString() };
    memoryDb.users.push(row);
    return [{ insertId: id }];
  }

  if (s.startsWith('update users set is_verified')) {
    const u = memoryDb.users.find((x) => x.id === params[0]);
    if (u) u.is_verified = true;
    return [{ affectedRows: 1 }];
  }

  if (s.startsWith('insert into volunteer_profiles')) {
    return [{ insertId: 1 }];
  }

  if (s.includes('select id, phone, name, email, role')) {
    return [memoryDb.users.map(({ id, phone, name, email, role, created_at }) => ({ id, phone, name, email, role, created_at }))];
  }

  if (s.includes('from vehicles where user_id')) {
    return [memoryDb.vehicles.filter((v) => v.user_id === params[0]).sort((a, b) => (b.is_default - a.is_default) || b.id - a.id)];
  }

  if (s.startsWith('insert into vehicles')) {
    const id = memoryDb._nextId.vehicles++;
    const row = { id, user_id: params[0], make: params[1], model: params[2], year: params[3], license_plate: params[4], color: params[5], fuel_type: params[6], is_default: params[7], created_at: new Date().toISOString() };
    memoryDb.vehicles.push(row);
    return [{ insertId: id }];
  }

  if (s.includes('from vehicles where id = ? and user_id')) {
    return [memoryDb.vehicles.filter((v) => v.id === parseInt(params[0], 10) && v.user_id === params[1])];
  }

  if (s.startsWith('update vehicles set is_default = false')) {
    memoryDb.vehicles.filter((v) => v.user_id === params[0]).forEach((v) => { v.is_default = false; });
    return [{ affectedRows: 1 }];
  }

  if (s.startsWith('update vehicles set make')) {
    const v = memoryDb.vehicles.find((x) => x.id === parseInt(params[7], 10));
    if (v) Object.assign(v, { make: params[0], model: params[1], year: params[2], license_plate: params[3], color: params[4], fuel_type: params[5], is_default: params[6] });
    return [{ affectedRows: 1 }];
  }

  if (s.startsWith('delete from vehicles')) {
    const idx = memoryDb.vehicles.findIndex((v) => v.id === parseInt(params[0], 10) && v.user_id === params[1]);
    if (idx >= 0) memoryDb.vehicles.splice(idx, 1);
    return [{ affectedRows: idx >= 0 ? 1 : 0 }];
  }

  if (s.includes('from service_types')) {
    if (s.includes('where id =')) return [memoryDb.service_types.filter((st) => st.id === params[0])];
    return [memoryDb.service_types.filter((st) => st.is_active)];
  }

  if (s.startsWith('insert into assistance_requests')) {
    const id = memoryDb._nextId.assistance_requests++;
    const row = {
      id, request_code: params[0], customer_id: params[1], vehicle_id: params[2], service_type_id: params[3],
      volunteer_id: null, status: 'pending', latitude: params[4], longitude: params[5], address: params[6],
      notes: params[7], estimated_price: params[8], final_price: null, payment_status: 'pending', payment_id: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed_at: null,
    };
    memoryDb.assistance_requests.push(row);
    return [{ insertId: id }];
  }

  if (s.startsWith('insert into request_tracking')) {
    const id = memoryDb._nextId.request_tracking++;
    memoryDb.request_tracking.push({
      id, request_id: params[0], status: params[1], latitude: params[2], longitude: params[3], message: params[4],
      created_at: new Date().toISOString(),
    });
    return [{ insertId: id }];
  }

  if (s.includes('join service_types st on ar.service_type_id = st.id') && s.includes('where ar.id =')) {
    const ar = memoryDb.assistance_requests.find((r) => r.id === parseInt(params[0], 10));
    if (!ar) return [[]];
    const st = memoryDb.service_types.find((s) => s.id === ar.service_type_id);
    const cu = memoryDb.users.find((u) => u.id === ar.customer_id);
    const vu = ar.volunteer_id ? memoryDb.users.find((u) => u.id === ar.volunteer_id) : null;
    const v = ar.vehicle_id ? memoryDb.vehicles.find((x) => x.id === ar.vehicle_id) : null;
    return [[{
      ...ar, service_name: st.name, service_slug: st.slug, service_icon: st.icon,
      customer_name: cu?.name, customer_phone: cu?.phone, volunteer_name: vu?.name, volunteer_phone: vu?.phone,
      make: v?.make, model: v?.model, license_plate: v?.license_plate, color: v?.color,
    }]];
  }

  if (s.includes('from assistance_requests ar') && s.includes('where ar.customer_id')) {
    return [enrichRequests(memoryDb.assistance_requests.filter((r) => r.customer_id === params[0]))];
  }

  if (s.includes('where ar.volunteer_id = ? or')) {
    const pending = memoryDb.assistance_requests.filter((r) => r.status === 'pending' && !r.volunteer_id);
    const mine = memoryDb.assistance_requests.filter((r) => r.volunteer_id === params[0]);
    return [enrichRequests([...mine, ...pending])];
  }

  if (s.includes('from assistance_requests where id = ?') && !s.includes('volunteer_id =')) {
    return [memoryDb.assistance_requests.filter((r) => r.id === parseInt(params[0], 10))];
  }

  if (s.startsWith('update assistance_requests set volunteer_id')) {
    const r = memoryDb.assistance_requests.find((x) => x.id === parseInt(params[2], 10));
    if (r) { r.volunteer_id = params[0]; r.status = params[1]; }
    return [{ affectedRows: 1 }];
  }

  if (s.startsWith('update assistance_requests set status = ? where id')) {
    const r = memoryDb.assistance_requests.find((x) => x.id === parseInt(params[1], 10));
    if (r) r.status = params[0];
    return [{ affectedRows: 1 }];
  }

  if (s.includes('set completed_at = now()')) {
    const r = memoryDb.assistance_requests.find((x) => x.id === parseInt(params[0], 10));
    if (r) r.completed_at = new Date().toISOString();
    return [{ affectedRows: 1 }];
  }

  if (s.includes('volunteer_profiles set total_jobs')) {
    const vp = memoryDb.volunteer_profiles.find((x) => x.user_id === params[0]);
    if (vp) vp.total_jobs += 1;
    return [{ affectedRows: 1 }];
  }

  if (s.includes('from request_tracking where request_id')) {
    return [memoryDb.request_tracking.filter((t) => t.request_id === parseInt(params[0], 10)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))];
  }

  if (s.includes('from assistance_requests where id = ? and customer_id')) {
    return [memoryDb.assistance_requests.filter((r) => r.id === parseInt(params[0], 10) && r.customer_id === params[1])];
  }

  if (s.startsWith('insert into payments')) {
    const id = memoryDb._nextId.payments++;
    const row = { id, request_id: params[0], amount: params[1], payment_method: params[2], transaction_id: params[3], status: params[4], currency: 'INR', created_at: new Date().toISOString() };
    memoryDb.payments.push(row);
    return [{ insertId: id }];
  }

  if (s.includes('from payments where id =')) {
    return [memoryDb.payments.filter((p) => p.id === params[0])];
  }

  if (s.startsWith('update payments set status')) {
    const p = memoryDb.payments.find((x) => x.id === params[1]);
    if (p) p.status = params[0];
    return [{ affectedRows: 1 }];
  }

  if (s.includes('assistance_requests set payment_status')) {
    const r = memoryDb.assistance_requests.find((x) => x.id === parseInt(params[3], 10));
    if (r) { r.payment_status = params[0]; r.payment_id = params[1]; r.final_price = params[2]; }
    return [{ affectedRows: 1 }];
  }

  if (s.includes('from payments p') && s.includes('where ar.customer_id')) {
    return [memoryDb.payments.filter((p) => {
      const ar = memoryDb.assistance_requests.find((r) => r.id === p.request_id);
      return ar?.customer_id === params[0];
    }).map((p) => {
      const ar = memoryDb.assistance_requests.find((r) => r.id === p.request_id);
      const st = memoryDb.service_types.find((s) => s.id === ar?.service_type_id);
      return { ...p, request_code: ar?.request_code, service_name: st?.name };
    })];
  }

  if (s.includes('from volunteer_profiles vp') && s.includes('where vp.user_id =')) {
    const vp = memoryDb.volunteer_profiles.find((x) => x.user_id === params[0]);
    const u = memoryDb.users.find((x) => x.id === params[0]);
    return [[{ ...vp, name: u?.name, phone: u?.phone }].filter(Boolean)];
  }

  if (s.includes("where ar.status = 'pending'")) {
    return [enrichRequests(memoryDb.assistance_requests.filter((r) => r.status === 'pending' && !r.volunteer_id), true)];
  }

  if (s.includes("ar.status in ('accepted','en_route','in_progress')")) {
    return [enrichRequests(memoryDb.assistance_requests.filter((r) => r.volunteer_id === params[0] && ['accepted', 'en_route', 'in_progress'].includes(r.status)), true)];
  }

  if (s.includes("status = 'completed'")) {
    const count = memoryDb.assistance_requests.filter((r) => r.volunteer_id === params[0] && r.status === 'completed').length;
    return [[{ count }]];
  }

  if (s.startsWith('update volunteer_profiles set is_available')) {
    const vp = memoryDb.volunteer_profiles.find((x) => x.user_id === params[1]);
    if (vp) vp.is_available = params[0];
    return [{ affectedRows: 1 }];
  }

  if (s.includes('volunteer_profiles set current_latitude')) {
    const vp = memoryDb.volunteer_profiles.find((x) => x.user_id === params[2]);
    if (vp) { vp.current_latitude = params[0]; vp.current_longitude = params[1]; }
    return [{ affectedRows: 1 }];
  }

  if (s.includes('from assistance_requests where id = ? and volunteer_id')) {
    return [memoryDb.assistance_requests.filter((r) => r.id === parseInt(params[0], 10) && r.volunteer_id === params[1])];
  }

  if (s.includes('select count(*) as total_customers')) {
    return [[{
      total_customers: memoryDb.users.filter((u) => u.role === 'customer').length,
      total_volunteers: memoryDb.users.filter((u) => u.role === 'volunteer').length,
      total_requests: memoryDb.assistance_requests.length,
      pending_requests: memoryDb.assistance_requests.filter((r) => r.status === 'pending').length,
      active_requests: memoryDb.assistance_requests.filter((r) => ['accepted', 'en_route', 'in_progress'].includes(r.status)).length,
      completed_requests: memoryDb.assistance_requests.filter((r) => r.status === 'completed').length,
      total_revenue: memoryDb.payments.filter((p) => p.status === 'success').reduce((s, p) => s + Number(p.amount), 0),
    }]];
  }

  if (s.includes('order by ar.created_at desc limit 15')) {
    return [enrichRequests([...memoryDb.assistance_requests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 15), false, true)];
  }

  if (s.includes('group by st.id, st.name')) {
    return [memoryDb.service_types.map((st) => ({
      name: st.name,
      count: memoryDb.assistance_requests.filter((r) => r.service_type_id === st.id).length,
    }))];
  }

  if (s.includes('join volunteer_profiles vp on u.id = vp.user_id')) {
    return [memoryDb.volunteer_profiles.map((vp) => {
      const u = memoryDb.users.find((x) => x.id === vp.user_id);
      return { id: u.id, name: u.name, phone: u.phone, is_available: vp.is_available, rating: vp.rating, total_jobs: vp.total_jobs };
    })];
  }

  console.warn('[MemoryDB] Unhandled query:', sql.slice(0, 120));
  return [[]];
}

function enrichRequests(requests, withCustomer = false, adminView = false) {
  return requests.map((ar) => {
    const st = memoryDb.service_types.find((s) => s.id === ar.service_type_id);
    const cu = memoryDb.users.find((u) => u.id === ar.customer_id);
    const vu = ar.volunteer_id ? memoryDb.users.find((u) => u.id === ar.volunteer_id) : null;
    const v = ar.vehicle_id ? memoryDb.vehicles.find((x) => x.id === ar.vehicle_id) : null;
    return {
      ...ar,
      service_name: st?.name,
      service_slug: st?.slug,
      service_icon: st?.icon,
      customer_name: cu?.name,
      customer_phone: cu?.phone,
      volunteer_name: vu?.name,
      volunteer_phone: vu?.phone,
      make: v?.make,
      model: v?.model,
      license_plate: v?.license_plate,
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function initPool() {
  if (useMemory) {
    console.log('[Kalon] Using in-memory database (USE_MEMORY_DB=true)');
    return { query: async (sql, params) => memoryQuery(sql, params) };
  }

  try {
    const mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kalon',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      waitForConnections: true,
      connectionLimit: 10,
    });
    await mysqlPool.query('SELECT 1');
    console.log('[Kalon] Connected to MySQL');
    return mysqlPool;
  } catch (err) {
    console.warn('[Kalon] MySQL unavailable, falling back to in-memory DB:', err.message);
    useMemory = true;
    return { query: async (sql, params) => memoryQuery(sql, params) };
  }
}

pool = await initPool();
export default pool;
