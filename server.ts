/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/database';
import { User, Lead, AssessmentQuestion, AssessmentOption, Module, CalendarBooking } from './src/types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // Helper: simple Bearer-token authentication
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }
    const userId = authHeader.split(' ')[1];
    const user = db.getUsers().find(u => u.id === userId);
    if (!user) {
      res.status(401).json({ error: 'User session not found' });
      return;
    }
    if (user.status_akun === 'nonaktif') {
      res.status(403).json({ error: 'Akun Anda dinonaktifkan oleh Admin' });
      return;
    }
    req.user = user;
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Akses ditolak. Memerlukan peran Admin.' });
      return;
    }
    next();
  };

  // --- HEALTH CHECK ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- AUTH ENDPOINTS ---
  app.post('/api/auth/register', (req, res) => {
    const { email, password, nama } = req.body;
    if (!email || !password || !nama) {
      res.status(400).json({ error: 'Email, nama, dan password harus diisi' });
      return;
    }

    const emailClean = email.toLowerCase().trim();
    const exists = db.getUsers().find(u => u.email === emailClean);
    if (exists) {
      res.status(400).json({ error: 'Email sudah terdaftar' });
      return;
    }

    const newUser: User = {
      id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      email: emailClean,
      password_hash: password, // Plain text for local portal prototype, can be hashed
      nama: nama.trim(),
      role: 'sales',
      status_akun: 'pending', // Pending approval by default
      status_sertifikasi: 'belum_lulus',
      referral_code: '', // Pending approval
      created_at: new Date().toISOString()
    };

    db.addUser(newUser);
    res.json({ message: 'Registrasi berhasil. Silakan tunggu persetujuan Admin.', user: { email: newUser.email, nama: newUser.nama, status_akun: newUser.status_akun } });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email dan password harus diisi' });
      return;
    }

    const emailClean = email.toLowerCase().trim();
    const user = db.getUsers().find(u => u.email === emailClean && u.password_hash === password);

    if (!user) {
      res.status(400).json({ error: 'Email atau password salah' });
      return;
    }

    if (user.status_akun === 'nonaktif') {
      res.status(403).json({ error: 'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.' });
      return;
    }

    res.json({
      message: 'Login berhasil',
      token: user.id, // we use user ID as a simple secure token for local storage
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        role: user.role,
        status_akun: user.status_akun,
        status_sertifikasi: user.status_sertifikasi,
        referral_code: user.referral_code,
        web3forms_key: user.web3forms_key
      }
    });
  });

  app.get('/api/auth/me', authenticate, (req, res) => {
    res.json({ user: req.user });
  });

  // --- SALES PROFILE & SETTINGS ---
  app.put('/api/sales/profile', authenticate, (req, res) => {
    const { nama, web3forms_key, password, avatar_url, whatsapp_link, schedule_availability } = req.body;
    if (!req.user) return;
    
    const updates: Partial<User> = {};
    if (nama) updates.nama = nama;
    if (web3forms_key !== undefined) updates.web3forms_key = web3forms_key;
    if (password) updates.password_hash = password;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (whatsapp_link !== undefined) updates.whatsapp_link = whatsapp_link;
    if (schedule_availability !== undefined) updates.schedule_availability = schedule_availability;

    const updated = db.updateUser(req.user.id, updates);
    res.json({ message: 'Profil berhasil diperbarui', user: updated });
  });



  // --- MODULES & PROGRESS ---
  app.get('/api/sales/modules', authenticate, (req, res) => {
    if (!req.user) return;
    const modules = [...db.getModules()].sort((a, b) => a.urutan - b.urutan);
    const progress = db.getProgress().filter(p => p.user_id === req.user?.id).map(p => p.module_id);
    res.json({ modules, completedIds: progress });
  });

  app.post('/api/sales/modules/toggle', authenticate, (req, res) => {
    const { moduleId, completed } = req.body;
    if (!req.user) return;

    if (req.user.status_sertifikasi !== 'lulus') {
      res.status(403).json({ error: 'Akses ditolak. Anda harus lulus sertifikasi AAJI/AASI terlebih dahulu untuk membuka modul pembelajaran.' });
      return;
    }

    db.toggleProgress(req.user.id, moduleId, completed);
    res.json({ success: true, message: completed ? 'Modul selesai dipelajari' : 'Progress modul direset' });
  });

  // --- LEADS & CRM ---
  app.get('/api/sales/leads', authenticate, (req, res) => {
    if (!req.user) return;
    let leads = db.getLeads();
    if (req.user.role !== 'admin') {
      leads = leads.filter(l => l.sales_id === req.user?.id);
    }
    const users = db.getUsers();
    const enriched = leads.map(l => {
      const sales = users.find(u => u.id === l.sales_id);
      return {
        ...l,
        sales_nama: sales ? sales.nama : 'Unknown Sales'
      };
    });
    const bookings = db.getBookings();
    res.json({ leads: enriched, bookings });
  });

  app.put('/api/sales/leads/update-status', authenticate, (req, res) => {
    const { leadId, status } = req.body;
    if (!req.user) return;

    const lead = db.getLeads().find(l => l.id === leadId);
    if (!lead) {
      res.status(404).json({ error: 'Lead tidak ditemukan' });
      return;
    }

    if (req.user.role !== 'admin' && lead.sales_id !== req.user.id) {
      res.status(403).json({ error: 'Akses ditolak. Ini bukan lead Anda.' });
      return;
    }

    db.updateLead(leadId, { status_crm: status });
    res.json({ message: 'Status pipeline CRM berhasil diperbarui' });
  });

  app.delete('/api/sales/leads/:leadId', authenticate, (req, res) => {
    const leadId = req.params.leadId;
    if (!req.user) return;
    const lead = db.getLeads().find(l => l.id === leadId);
    if (!lead) {
      res.status(404).json({ error: 'Lead tidak ditemukan' });
      return;
    }
    if (req.user.role !== 'admin' && lead.sales_id !== req.user.id) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    db.deleteLead(leadId);
    res.json({ message: 'Lead dihapus' });
  });

  app.post('/api/sales/bookings/no-show', authenticate, (req, res) => {
    const { bookingId } = req.body;
    if (!req.user) return;

    const booking = db.getBookings().find(b => b.id === bookingId);
    if (!booking) {
      res.status(404).json({ error: 'Booking tidak ditemukan' });
      return;
    }

    db.updateBookingStatus(bookingId, 'no_show');
    res.json({ message: 'Lead ditandai sebagai No-Show' });
  });

  // --- LEADERBOARD ---
  app.get('/api/sales/leaderboard', authenticate, (req, res) => {
    const users = db.getUsers().filter(u => u.role === 'sales');
    const leads = db.getLeads();

    const leaderboard = users.map(user => {
      const userLeads = leads.filter(l => l.sales_id === user.id);
      const leadsGenerated = userLeads.length;
      const leadsClosed = userLeads.filter(l => l.status_crm === 'closed').length;
      return {
        id: user.id,
        nama: user.nama,
        status_sertifikasi: user.status_sertifikasi,
        leadsGenerated,
        leadsClosed,
        score: (leadsGenerated * 10) + (leadsClosed * 50) // custom score logic
      };
    }).sort((a, b) => b.score - a.score || b.leadsGenerated - a.leadsGenerated);

    res.json({ leaderboard });
  });

  // --- LEAD ASSESSMENT (LANDING PAGE API) ---
  app.get('/api/assessment/config', (req, res) => {
    const { ref } = req.query;
    if (!ref) {
      res.status(400).json({ error: 'Referral code is required. Please use ?ref=CODE.' });
      return;
    }

    const sales = db.getUsers().find(u => u.referral_code === (ref as string).toUpperCase() && u.status_akun === 'aktif');
    if (!sales) {
      res.status(400).json({ error: 'Referral code tidak aktif atau tidak ditemukan.' });
      return;
    }

    // Return current active questions, active options, form settings
    const activeQuestions = [...db.getQuestions()]
      .filter(q => q.status === 'aktif')
      .sort((a, b) => a.urutan - b.urutan);

    const questionIds = activeQuestions.map(q => q.id);
    const activeOptions = db.getOptions().filter(o => questionIds.includes(o.question_id));

    const settingsMap: Record<string, string> = {};
    db.getSettings().forEach(s => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      sales: {
        id: sales.id,
        nama: sales.nama,
        email: sales.email,
        web3forms_key: sales.web3forms_key,
        avatar_url: sales.avatar_url,
        whatsapp_link: sales.whatsapp_link,
        schedule_availability: sales.schedule_availability
      },
      questions: activeQuestions,
      options: activeOptions,
      settings: settingsMap
    });
  });

  app.post('/api/assessment/submit', (req, res) => {
    const {
      sales_id,
      nama_calon_nasabah,
      whatsapp,
      email,
      tanggal_lahir,
      status_pernikahan,
      pekerjaan,
      jumlah_tanggungan,
      kondisi_finansial, // { income, expenses, debt, emergency_fund }
      proteksi_existing, // array
      jawaban_raw, // Record<questionId, optionId>
      skor_prediksi_diri, // prediction value
      booking_time, // zoom schedule
      honeypot, // Anti-spam
      turnstile_token // Cloudflare Turnstile token
    } = req.body;

    // 1. Honeypot check
    if (honeypot) {
      res.status(400).json({ error: 'Spam detected' });
      return;
    }

    if (!sales_id || !nama_calon_nasabah || !whatsapp || !tanggal_lahir) {
      res.status(400).json({ error: 'Lengkapi semua field utama yang diwajibkan' });
      return;
    }

    const sales = db.getUsers().find(u => u.id === sales_id);
    if (!sales || sales.status_akun !== 'aktif') {
      res.status(400).json({ error: 'Sales consultant tidak aktif atau tidak valid.' });
      return;
    }

    // 2. Compute dynamic score snapshot
    const activeQuestions = db.getQuestions().filter(q => q.status === 'aktif');
    const scoredQuestions = activeQuestions.filter(q => q.is_scored);
    
    // Dynamic score bounds based on active questions
    let scoreMin = 0;
    let scoreMax = 0;
    let actualScore = 0;

    // Cache options by question
    const options = db.getOptions();

    // Map through scored questions to find options and compute min/max
    scoredQuestions.forEach(q => {
      const qOpts = options.filter(o => o.question_id === q.id);
      if (qOpts.length > 0) {
        const scores = qOpts.map(o => o.skor_value);
        scoreMin += Math.min(...scores);
        scoreMax += Math.max(...scores);
      }
    });

    // Capture response snapshots
    const answerSnapshot: Record<string, { question: string; answer: string; score: number }> = {};
    
    Object.entries(jawaban_raw || {}).forEach(([qId, oId]) => {
      const q = activeQuestions.find(item => item.id === qId);
      const opt = options.find(item => item.id === oId);
      if (q && opt) {
        answerSnapshot[qId] = {
          question: q.pertanyaan_text,
          answer: opt.label_text,
          score: q.is_scored ? opt.skor_value : 0
        };
        if (q.is_scored) {
          actualScore += opt.skor_value;
        }
      }
    });

    // Calculate score percentage (for compatibility)
    const scoredPercent = scoreMax > 0 ? (actualScore / scoreMax) * 100 : 0;

    // Category result based on actualScore (Q2-Q6, range 5 to 20)
    let categoryResult = 'THE CRITICAL ZONE';
    if (actualScore >= 5 && actualScore <= 8) {
      categoryResult = 'THE FORTIFIED ZONE';
    } else if (actualScore >= 9 && actualScore <= 12) {
      categoryResult = 'THE EXPOSED ZONE';
    } else if (actualScore >= 13 && actualScore <= 16) {
      categoryResult = 'THE VULNERABLE ZONE';
    } else if (actualScore >= 17 && actualScore <= 20) {
      categoryResult = 'THE CRITICAL ZONE';
    }

    // 3. Evaluate Awareness Gap
    // Compare actual scored level against user's self-predicted value (skor_prediksi_diri from Q6, range 1 to 4)
    let actualLevel = 4; // Fallback
    if (categoryResult === 'THE FORTIFIED ZONE') actualLevel = 1;
    else if (categoryResult === 'THE EXPOSED ZONE') actualLevel = 2;
    else if (categoryResult === 'THE VULNERABLE ZONE') actualLevel = 3;
    else if (categoryResult === 'THE CRITICAL ZONE') actualLevel = 4;

    const q6AnswerId = jawaban_raw?.['q6'];
    const q6Opt = options.find(item => item.id === q6AnswerId);
    const selfPrediction = q6Opt ? q6Opt.skor_value : (Number(skor_prediksi_diri) || 2);

    let gapResult = 'Sesuai (Akurat)';
    if (actualLevel > selfPrediction) {
      gapResult = 'Over-confident (Kesadaran Rendah)';
    } else if (actualLevel < selfPrediction) {
      gapResult = 'Under-confident (Kekhawatiran Berlebih)';
    }

    // Segment profesi matching based on job title & main job sector (Q1)
    const q1AnswerId = jawaban_raw?.['q1'];
    const q1Opt = options.find(item => item.id === q1AnswerId);
    const pLower = (pekerjaan || '').toLowerCase();
    let segmen = 'General Retail';
    
    if (
      (q1Opt && q1Opt.label_text.includes('Pengusaha')) || 
      pLower.includes('ceo') || pLower.includes('direktur') || 
      pLower.includes('pemilik') || pLower.includes('owner') || 
      pLower.includes('dokter') || pLower.includes('spesialis')
    ) {
      segmen = 'HNW (High-Net-Worth)';
    } else if (
      (q1Opt && q1Opt.label_text.includes('Mandiri')) || 
      pLower.includes('manager') || pLower.includes('supervisor') || 
      pLower.includes('pns') || pLower.includes('insinyur')
    ) {
      segmen = 'Mass Affluent';
    }

    // Create lead entry
    const newLeadId = `l-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newLead: Lead = {
      id: newLeadId,
      sales_id: sales.id,
      nama_calon_nasabah: nama_calon_nasabah.trim(),
      whatsapp: whatsapp.trim(),
      email: email ? email.trim() : '',
      tanggal_lahir,
      status_pernikahan,
      pekerjaan: pekerjaan || 'Belum Diisi',
      jumlah_tanggungan: Number(jumlah_tanggungan) || 0,
      kondisi_finansial: {
        income: kondisi_finansial?.income || 'Belum Diisi',
        expenses: kondisi_finansial?.expenses || 'Belum Diisi',
        debt: kondisi_finansial?.debt || 'Belum Diisi',
        emergency_fund: kondisi_finansial?.emergency_fund || 'Belum Diisi',
        ada_tanggungan_lain: kondisi_finansial?.ada_tanggungan_lain || 'Tidak'
      },
      proteksi_existing: proteksi_existing || [],
      jawaban_assessment: answerSnapshot,
      segmen_profesi: segmen,
      skor_aktual: actualScore,
      skor_range_min: scoreMin,
      skor_range_max: scoreMax,
      skor_prediksi_diri: selfPrediction,
      kategori_hasil: categoryResult,
      gap_kesadaran: gapResult,
      status_crm: 'baru',
      consent_diberikan: true,
      consent_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    db.addLead(newLead);

    // Save Calendar booking if supplied
    if (booking_time) {
      const newBooking: CalendarBooking = {
        id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sales_id: sales.id,
        lead_id: newLeadId,
        google_event_id: `gcal-${Date.now()}`,
        waktu_booking: booking_time,
        status: 'confirmed'
      };
      db.addBooking(newBooking);
    }

    res.json({
      success: true,
      message: 'Assessment berhasil diserahkan',
      leadId: newLeadId,
      result: {
        score: actualScore,
        scoreMax,
        percent: Math.round(scoredPercent),
        category: categoryResult,
        gap: gapResult,
        segmen
      }
    });
  });

  // --- ADMIN CMS ENDPOINTS ---
  app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
    res.json({ users: db.getUsers() });
  });

  app.post('/api/admin/users/approve', authenticate, requireAdmin, (req, res) => {
    const { userId } = req.body;
    const user = db.getUsers().find(u => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    // Generate referral code: First 3-4 letters of name + 3 digits
    // uppercase, non-alphabet removed
    const baseName = user.nama.toUpperCase().replace(/[^A-Z]/g, '');
    const prefix = baseName.substr(0, Math.min(4, Math.max(3, baseName.length))) || 'SAMOIA';
    
    let code = '';
    let exists = true;
    let retries = 0;

    while (exists && retries < 5) {
      const randDigits = Math.floor(100 + Math.random() * 900); // 3 digits
      code = `${prefix}${randDigits}`;
      exists = db.getUsers().some(u => u.referral_code === code);
      retries++;
    }

    if (exists) {
      // fallback
      code = Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    db.updateUser(userId, { status_akun: 'aktif', referral_code: code });
    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'APPROVE_USER',
      target_type: 'users',
      target_id: userId,
      detail: { referral_code: code, email: user.email }
    });

    res.json({ message: `User berhasil disetujui. Kode Referral: ${code}`, code });
  });

  app.post('/api/admin/users/certify', authenticate, requireAdmin, (req, res) => {
    const { userId, status } = req.body;
    const user = db.getUsers().find(u => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    db.updateUser(userId, { status_sertifikasi: status });
    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'UPDATE_CERTIFICATION',
      target_type: 'users',
      target_id: userId,
      detail: { status_sertifikasi: status, email: user.email }
    });

    res.json({ message: 'Status sertifikasi berhasil diperbarui' });
  });

  app.post('/api/admin/users/deactivate', authenticate, requireAdmin, (req, res) => {
    const { userId } = req.body;
    const user = db.getUsers().find(u => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    db.updateUser(userId, { status_akun: 'nonaktif' });
    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'DEACTIVATE_USER',
      target_type: 'users',
      target_id: userId,
      detail: { email: user.email }
    });

    // Prompt backend warning counts of reassignment
    const pendingLeads = db.getLeads().filter(l => l.sales_id === userId && l.status_crm !== 'closed' && l.status_crm !== 'lost').length;

    res.json({ message: 'Akun dinonaktifkan', pendingLeadsToReassign: pendingLeads });
  });

  app.post('/api/admin/users/reassign-leads', authenticate, requireAdmin, (req, res) => {
    const { fromSalesId, toSalesId } = req.body;
    if (!fromSalesId || !toSalesId) {
      res.status(400).json({ error: 'Sumber sales dan tujuan sales harus diisi' });
      return;
    }

    const fromUser = db.getUsers().find(u => u.id === fromSalesId);
    const toUser = db.getUsers().find(u => u.id === toSalesId);
    if (!fromUser || !toUser) {
      res.status(404).json({ error: 'Sales asal atau tujuan tidak ditemukan' });
      return;
    }

    let reassignedCount = 0;
    db.getLeads().forEach(lead => {
      if (lead.sales_id === fromSalesId && lead.status_crm !== 'closed' && lead.status_crm !== 'lost') {
        db.updateLead(lead.id, { sales_id: toSalesId });
        reassignedCount++;
      }
    });

    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'REASSIGN_LEADS',
      target_type: 'leads',
      target_id: fromSalesId,
      detail: { from: fromUser.nama, to: toUser.nama, count: reassignedCount }
    });

    res.json({ message: `${reassignedCount} Leads berhasil dialihkan ke ${toUser.nama}` });
  });

  app.put('/api/admin/users/update-code', authenticate, requireAdmin, (req, res) => {
    const { userId, newCode } = req.body;
    if (!newCode) {
      res.status(400).json({ error: 'Kode referral baru tidak boleh kosong' });
      return;
    }

    const codeClean = newCode.toUpperCase().trim();
    const exists = db.getUsers().find(u => u.referral_code === codeClean && u.id !== userId);
    if (exists) {
      res.status(400).json({ error: 'Kode referral ini sudah digunakan oleh sales lain' });
      return;
    }

    db.updateUser(userId, { referral_code: codeClean });
    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'OVERRIDE_REFERRAL_CODE',
      target_type: 'users',
      target_id: userId,
      detail: { code: codeClean }
    });

    res.json({ message: `Kode referral berhasil dirubah ke ${codeClean}` });
  });

  // ASSESSMENT CMS
  app.get('/api/admin/questions', authenticate, requireAdmin, (req, res) => {
    res.json({ questions: db.getQuestions(), options: db.getOptions() });
  });

  app.post('/api/admin/questions', authenticate, requireAdmin, (req, res) => {
    const { pertanyaan_text, is_scored, scoring_group, status, options } = req.body;
    if (!pertanyaan_text) {
      res.status(400).json({ error: 'Teks pertanyaan harus diisi' });
      return;
    }

    const qId = `q-${Date.now()}`;
    const nextUrutan = db.getQuestions().length + 1;

    const newQ: AssessmentQuestion = {
      id: qId,
      pertanyaan_text,
      urutan: nextUrutan,
      is_scored: !!is_scored,
      scoring_group: scoring_group || 'kategori_utama',
      status: status || 'aktif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.addQuestion(newQ);

    // Save options
    const formattedOptions: AssessmentOption[] = (options || []).map((o: any, idx: number) => ({
      id: `o-${Date.now()}-${idx}`,
      question_id: qId,
      label_text: o.label_text,
      skor_value: Number(o.skor_value) || 0,
      urutan: idx + 1
    }));

    db.setOptions(qId, formattedOptions);

    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'CREATE_QUESTION',
      target_type: 'assessment_questions',
      target_id: qId,
      detail: { text: pertanyaan_text }
    });

    res.json({ message: 'Pertanyaan berhasil ditambahkan', question: newQ });
  });

  app.put('/api/admin/questions/:id', authenticate, requireAdmin, (req, res) => {
    const qId = req.params.id;
    const { pertanyaan_text, is_scored, scoring_group, status, options, urutan } = req.body;

    const updated = db.updateQuestion(qId, {
      pertanyaan_text,
      is_scored: is_scored !== undefined ? !!is_scored : undefined,
      scoring_group,
      status,
      urutan: urutan !== undefined ? Number(urutan) : undefined
    });

    if (!updated) {
      res.status(404).json({ error: 'Pertanyaan tidak ditemukan' });
      return;
    }

    if (options) {
      const formattedOptions: AssessmentOption[] = options.map((o: any, idx: number) => ({
        id: o.id || `o-${Date.now()}-${idx}`,
        question_id: qId,
        label_text: o.label_text,
        skor_value: Number(o.skor_value) || 0,
        urutan: idx + 1
      }));
      db.setOptions(qId, formattedOptions);
    }

    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'UPDATE_QUESTION',
      target_type: 'assessment_questions',
      target_id: qId,
      detail: { text: pertanyaan_text }
    });

    res.json({ message: 'Pertanyaan berhasil diperbarui' });
  });

  app.delete('/api/admin/questions/:id', authenticate, requireAdmin, (req, res) => {
    const qId = req.params.id;
    db.deleteQuestion(qId);

    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'DELETE_QUESTION',
      target_type: 'assessment_questions',
      target_id: qId,
      detail: {}
    });

    res.json({ message: 'Pertanyaan berhasil dihapus' });
  });

  // SETTINGS CMS
  app.put('/api/admin/settings', authenticate, requireAdmin, (req, res) => {
    const updates = req.body; // Record<key, value>
    Object.entries(updates).forEach(([key, value]) => {
      db.updateSetting(key, String(value));
    });

    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'UPDATE_SETTINGS',
      target_type: 'settings',
      target_id: 'global',
      detail: { keys: Object.keys(updates) }
    });

    res.json({ message: 'Pengaturan CMS berhasil diperbarui' });
  });

  // LEARNING MODULES CMS
  app.get('/api/admin/modules', authenticate, requireAdmin, (req, res) => {
    res.json({ modules: db.getModules() });
  });

  app.post('/api/admin/modules', authenticate, requireAdmin, (req, res) => {
    const { judul, youtube_url, urutan } = req.body;
    if (!judul || !youtube_url) {
      res.status(400).json({ error: 'Judul dan URL YouTube harus diisi' });
      return;
    }

    const newM: Module = {
      id: `m-${Date.now()}`,
      judul,
      youtube_url,
      urutan: Number(urutan) || (db.getModules().length + 1)
    };

    db.addModule(newM);
    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'CREATE_MODULE',
      target_type: 'modules',
      target_id: newM.id,
      detail: { judul }
    });

    res.json({ message: 'Modul pembelajaran berhasil ditambahkan', module: newM });
  });

  app.put('/api/admin/modules/:id', authenticate, requireAdmin, (req, res) => {
    const mId = req.params.id;
    const { judul, youtube_url, urutan } = req.body;

    const updated = db.updateModule(mId, {
      judul,
      youtube_url,
      urutan: urutan !== undefined ? Number(urutan) : undefined
    });

    if (!updated) {
      res.status(404).json({ error: 'Modul tidak ditemukan' });
      return;
    }

    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'UPDATE_MODULE',
      target_type: 'modules',
      target_id: mId,
      detail: { judul }
    });

    res.json({ message: 'Modul berhasil diperbarui' });
  });

  app.delete('/api/admin/modules/:id', authenticate, requireAdmin, (req, res) => {
    const mId = req.params.id;
    db.deleteModule(mId);

    db.addAuditLog({
      admin_id: req.user!.id,
      admin_nama: req.user!.nama,
      action_type: 'DELETE_MODULE',
      target_type: 'modules',
      target_id: mId,
      detail: {}
    });

    res.json({ message: 'Modul berhasil dihapus' });
  });

  // LEADS CMS
  app.get('/api/admin/leads', authenticate, requireAdmin, (req, res) => {
    const leads = db.getLeads();
    const users = db.getUsers();
    // Attach sales names
    const enriched = leads.map(l => {
      const sales = users.find(u => u.id === l.sales_id);
      return {
        ...l,
        sales_nama: sales ? sales.nama : 'Unknown Sales'
      };
    });
    res.json({ leads: enriched });
  });

  app.get('/api/admin/audit-logs', authenticate, requireAdmin, (req, res) => {
    res.json({ auditLogs: db.getAuditLogs() });
  });

  // --- VITE DEV SERVER OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start full-stack server:', err);
});
