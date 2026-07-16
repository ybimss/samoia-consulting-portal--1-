import { getDatabase } from '../server/database';

interface Env {}

interface AuthUser {
  id: string;
  role: string;
  status_akun?: string;
  status_sertifikasi?: string;
}

const jsonResponse = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });

const getAuthUser = (request: Request) => {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const db = getDatabase();
  const user = db.getUsers().find((u) => u.id === token);
  if (!user || user.status_akun === 'nonaktif') return null;
  return user as AuthUser;
};

const requireAuth = (request: Request) => {
  const user = getAuthUser(request);
  if (!user) {
    return { user: null, response: jsonResponse({ error: 'Missing or invalid session' }, { status: 401 }) };
  }
  return { user, response: null };
};

const requireAdmin = (request: Request) => {
  const auth = requireAuth(request);
  if (auth.response) return auth;
  if (auth.user?.role !== 'admin') {
    return { user: null, response: jsonResponse({ error: 'Akses ditolak. Memerlukan peran Admin.' }, { status: 403 }) };
  }
  return auth;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/health') {
      return jsonResponse({ status: 'ok', time: new Date().toISOString() });
    }

    if (path === '/api/auth/me') {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const db = getDatabase();
      const user = token ? db.getUsers().find((u) => u.id === token) : null;
      if (!user) {
        return jsonResponse({ error: 'Missing or invalid session' }, { status: 401 });
      }
      return jsonResponse({ user });
    }

    if (path === '/api/auth/login') {
      if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
      const body = await request.json().catch(() => ({}));
      const { email, password } = body as { email?: string; password?: string };
      const db = getDatabase();
      const user = db.getUsers().find((u) => u.email === email?.toLowerCase().trim() && u.password_hash === password);
      if (!user) {
        return jsonResponse({ error: 'Email atau password salah' }, { status: 400 });
      }
      if (user.status_akun === 'nonaktif') {
        return jsonResponse({ error: 'Akun Anda telah dinonaktifkan' }, { status: 403 });
      }
      return jsonResponse({
        message: 'Login berhasil',
        token: user.id,
        user: {
          id: user.id,
          email: user.email,
          nama: user.nama,
          role: user.role,
          status_akun: user.status_akun,
          status_sertifikasi: user.status_sertifikasi,
          referral_code: user.referral_code,
          web3forms_key: user.web3forms_key,
        },
      });
    }

    if (path === '/api/auth/register') {
      if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
      const body = await request.json().catch(() => ({}));
      const { email, password, nama } = body as { email?: string; password?: string; nama?: string };
      if (!email || !password || !nama) {
        return jsonResponse({ error: 'Email, nama, dan password harus diisi' }, { status: 400 });
      }
      const db = getDatabase();
      const emailClean = email.toLowerCase().trim();
      if (db.getUsers().some((u) => u.email === emailClean)) {
        return jsonResponse({ error: 'Email sudah terdaftar' }, { status: 400 });
      }
      const newUser = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        email: emailClean,
        password_hash: password,
        nama: nama.trim(),
        role: 'sales',
        status_akun: 'pending',
        status_sertifikasi: 'belum_lulus',
        referral_code: '',
        created_at: new Date().toISOString(),
      } as any;
      db.addUser(newUser);
      return jsonResponse({ message: 'Registrasi berhasil. Silakan tunggu persetujuan Admin.', user: { email: newUser.email, nama: newUser.nama, status_akun: newUser.status_akun } });
    }

    if (path === '/api/assessment/config') {
      const db = getDatabase();
      const sales = db.getUsers().find((u) => u.referral_code === url.searchParams.get('ref')) || null;
      return jsonResponse({
        sales,
        questions: db.getQuestions(),
        options: db.getOptions(),
        settings: Object.fromEntries(db.getSettings().map((s) => [s.key, s.value])),
      });
    }

    if (path === '/api/assessment/submit') {
      if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
      const body = await request.json().catch(() => ({}));
      const db = getDatabase();
      db.addLead({
        id: `lead-${Date.now()}`,
        sales_id: body.sales_id || 'admin-id',
        nama: body.nama_calon_nasabah || 'Unknown',
        whatsapp: body.whatsapp || '',
        email: body.email || '',
        status_crm: 'baru',
        created_at: new Date().toISOString(),
      } as any);
      return jsonResponse({ result: { ok: true, message: 'Assessment submitted' } });
    }

    if (path === '/api/sales/modules') {
      const auth = requireAuth(request);
      if (auth.response) return auth.response;
      const db = getDatabase();
      const modules = [...db.getModules()].sort((a, b) => a.urutan - b.urutan);
      const progress = db.getProgress().filter((p) => p.user_id === auth.user?.id).map((p) => p.module_id);
      return jsonResponse({ modules, completedIds: progress });
    }

    if (path === '/api/sales/modules/toggle') {
      const auth = requireAuth(request);
      if (auth.response) return auth.response;
      if (auth.user?.status_sertifikasi !== 'lulus') {
        return jsonResponse({ error: 'Akses ditolak. Anda harus lulus sertifikasi AAJI/AASI terlebih dahulu untuk membuka modul pembelajaran.' }, { status: 403 });
      }
      const body = await request.json().catch(() => ({}));
      const db = getDatabase();
      db.toggleProgress(auth.user!.id, body.moduleId, body.completed);
      return jsonResponse({ success: true, message: body.completed ? 'Modul selesai dipelajari' : 'Progress modul direset' });
    }

    if (path === '/api/sales/leads') {
      const auth = requireAuth(request);
      if (auth.response) return auth.response;
      const db = getDatabase();
      let leads = db.getLeads();
      if (auth.user?.role !== 'admin') {
        leads = leads.filter((l) => l.sales_id === auth.user?.id);
      }
      const users = db.getUsers();
      const enriched = leads.map((l) => ({ ...l, sales_nama: users.find((u) => u.id === l.sales_id)?.nama || 'Unknown Sales' }));
      return jsonResponse({ leads: enriched, bookings: db.getBookings() });
    }

    if (path === '/api/sales/leads/update-status') {
      const auth = requireAuth(request);
      if (auth.response) return auth.response;
      const body = await request.json().catch(() => ({}));
      const db = getDatabase();
      const lead = db.getLeads().find((l) => l.id === body.leadId);
      if (!lead) return jsonResponse({ error: 'Lead tidak ditemukan' }, { status: 404 });
      if (auth.user?.role !== 'admin' && lead.sales_id !== auth.user?.id) {
        return jsonResponse({ error: 'Akses ditolak. Ini bukan lead Anda.' }, { status: 403 });
      }
      db.updateLead(body.leadId, { status_crm: body.status });
      return jsonResponse({ message: 'Status pipeline CRM berhasil diperbarui' });
    }

    if (path === '/api/sales/profile') {
      const auth = requireAuth(request);
      if (auth.response) return auth.response;
      const body = await request.json().catch(() => ({}));
      const db = getDatabase();
      const updates: any = {};
      if (body.nama) updates.nama = body.nama;
      if (body.web3forms_key !== undefined) updates.web3forms_key = body.web3forms_key;
      if (body.password) updates.password_hash = body.password;
      if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
      if (body.whatsapp_link !== undefined) updates.whatsapp_link = body.whatsapp_link;
      if (body.schedule_availability !== undefined) updates.schedule_availability = body.schedule_availability;
      db.updateUser(auth.user!.id, updates);
      return jsonResponse({ message: 'Profil berhasil diperbarui', user: db.getUsers().find((u) => u.id === auth.user!.id) });
    }

    if (path === '/api/admin/users') {
      const auth = requireAdmin(request);
      if (auth.response) return auth.response;
      return jsonResponse({ users: getDatabase().getUsers() });
    }

    if (path === '/api/admin/questions') {
      const auth = requireAdmin(request);
      if (auth.response) return auth.response;
      return jsonResponse({ questions: getDatabase().getQuestions(), options: getDatabase().getOptions() });
    }

    if (path === '/api/admin/settings') {
      const auth = requireAdmin(request);
      if (auth.response) return auth.response;
      const db = getDatabase();
      return jsonResponse({ settings: Object.fromEntries(db.getSettings().map((s) => [s.key, s.value])) });
    }

    if (path === '/api/admin/modules') {
      const auth = requireAdmin(request);
      if (auth.response) return auth.response;
      return jsonResponse({ modules: getDatabase().getModules() });
    }

    if (path === '/api/admin/leads') {
      const auth = requireAdmin(request);
      if (auth.response) return auth.response;
      return jsonResponse({ leads: getDatabase().getLeads(), bookings: getDatabase().getBookings() });
    }

    if (path === '/api/admin/audit-logs') {
      const auth = requireAdmin(request);
      if (auth.response) return auth.response;
      return jsonResponse({ auditLogs: getDatabase().getAuditLogs() });
    }

    return jsonResponse({ error: 'Not found' }, { status: 404 });
  },
};
