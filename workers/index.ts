import { getDatabase } from '../server/database';

interface Env {}

const jsonResponse = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });

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

    return jsonResponse({ error: 'Not found' }, { status: 404 });
  },
};
