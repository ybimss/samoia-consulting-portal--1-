/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { 
  User, Lead, AssessmentQuestion, AssessmentOption, 
  Module, ModuleProgress, CalendarBooking, Setting, AuditLog 
} from '../src/types';

const DB_FILE = path.join(process.cwd(), 'database.json');

interface DatabaseSchema {
  users: User[];
  leads: Lead[];
  assessment_questions: AssessmentQuestion[];
  assessment_options: AssessmentOption[];
  modules: Module[];
  module_progress: ModuleProgress[];
  calendar_bookings: CalendarBooking[];
  settings: Setting[];
  audit_logs: AuditLog[];
}

const DEFAULT_SETTINGS: Setting[] = [
  { key: 'assessment_judul', value: 'Samoia Consulting — Personal Wealth & Risk Analysis v2' },
  { key: 'assessment_subheadline', value: 'Evaluate your dynamic financial security index, identify protection gaps, and book an exclusive Zoom strategy session with your personal consultant.' },
  { key: 'teks_pitch', value: 'Samoia Consulting specializes in high-class wealth preservation, custom risk-management frameworks, and private financial planning for elite sales forces.' },
  { key: 'kebijakan_privasi', value: 'We strictly comply with the Personal Data Protection (PDP) act. Your assessment snapshots and financial inputs are encrypted and only accessible to your designated Samoia professional consultant.' },
  { key: 'discord_invite_link', value: 'https://discord.gg/samoia-consulting' },
  { key: 'server_status', value: 'online' },
  { key: 'skor_kategori_thresholds', value: JSON.stringify([
    { name: 'Sangat Rentan', min_percent: 0, max_percent: 35 },
    { name: 'Rentan', min_percent: 36, max_percent: 60 },
    { name: 'Cukup Aman', min_percent: 61, max_percent: 85 },
    { name: 'Sangat Aman', min_percent: 86, max_percent: 100 }
  ]) }
];

const DEFAULT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1',
    pertanyaan_text: 'Apa status pekerjaan atau sumber penghasilan utama Anda saat ini? (NO SCORE)',
    urutan: 1,
    is_scored: false,
    scoring_group: 'segmentasi',
    status: 'aktif',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'q2',
    pertanyaan_text: 'Bagaimana perasaan Anda tentang kondisi finansial Anda & keluarga saat ini?',
    urutan: 2,
    is_scored: true,
    scoring_group: 'kategori_utama',
    status: 'aktif',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'q3',
    pertanyaan_text: 'Jika penghasilan utama Anda terhenti tiba-tiba HARI INI, berapa lama Anda & keluarga bisa bertahan dengan tabungan/aset yang ada?',
    urutan: 3,
    is_scored: true,
    scoring_group: 'kategori_utama',
    status: 'aktif',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'q4',
    pertanyaan_text: 'Jika Anda sebagai pencari nafkah utama tiba-tiba tidak bisa lagi bekerja (sakit kritis atau meninggal), siapa yang akan langsung terdampak secara finansial?',
    urutan: 4,
    is_scored: true,
    scoring_group: 'kategori_utama',
    status: 'aktif',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'q5',
    pertanyaan_text: 'Dari semua kemungkinan ini, mana yang membuat Anda paling tidak bisa tidur nyenyak kalau dipikirkan?',
    urutan: 5,
    is_scored: true,
    scoring_group: 'kategori_utama',
    status: 'aktif',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'q6',
    pertanyaan_text: 'Seberapa lengkap proteksi keuangan Anda saat ini, khususnya untuk risiko kesehatan/penyakit kritis dan risiko kematian?',
    urutan: 6,
    is_scored: true,
    scoring_group: 'kategori_utama',
    status: 'aktif',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const DEFAULT_OPTIONS: AssessmentOption[] = [
  // Options for Q1
  { id: 'o1_1', question_id: 'q1', label_text: 'A) Karyawan Tetap (Swasta / Pemerintah / BUMN)', skor_value: 0, urutan: 1 },
  { id: 'o1_2', question_id: 'q1', label_text: 'B) Profesional Mandiri / Freelancer (klien berganti-ganti)', skor_value: 0, urutan: 2 },
  { id: 'o1_3', question_id: 'q1', label_text: 'C) Pengusaha / Pemilik Bisnis (punya karyawan)', skor_value: 0, urutan: 3 },
  { id: 'o1_4', question_id: 'q1', label_text: 'D) Lainnya (pelajar, mahasiswa, atau status lain)', skor_value: 0, urutan: 4 },
  
  // Options for Q2
  { id: 'o2_1', question_id: 'q2', label_text: 'A) Sangat stabil & aman — Sudah ada tabungan & proteksi memadai.', skor_value: 1, urutan: 1 },
  { id: 'o2_2', question_id: 'q2', label_text: 'B) Cukup stabil, tapi ada pikiran — Aman secara umum, tapi suka kepikiran risiko tak terduga.', skor_value: 2, urutan: 2 },
  { id: 'o2_3', question_id: 'q2', label_text: 'C) Kadang stabil, kadang tidak — Penghasilan naik-turun, sulit bikin rencana jangka panjang.', skor_value: 3, urutan: 3 },
  { id: 'o2_4', question_id: 'q2', label_text: 'D) Butuh perbaikan — Cicilan/kewajiban besar, khawatir gak bisa penuhi kebutuhan.', skor_value: 4, urutan: 4 },

  // Options for Q3
  { id: 'o3_1', question_id: 'q3', label_text: 'A) Lebih dari 5 tahun', skor_value: 1, urutan: 1 },
  { id: 'o3_2', question_id: 'q3', label_text: 'B) 1–5 tahun', skor_value: 2, urutan: 2 },
  { id: 'o3_3', question_id: 'q3', label_text: 'C) Kurang dari 1 tahun', skor_value: 3, urutan: 3 },
  { id: 'o3_4', question_id: 'q3', label_text: 'D) Kurang dari 6 bulan', skor_value: 4, urutan: 4 },

  // Options for Q4
  { id: 'o4_1', question_id: 'q4', label_text: 'A) Hanya saya pribadi — belum ada tanggungan.', skor_value: 1, urutan: 1 },
  { id: 'o4_2', question_id: 'q4', label_text: 'B) Pasangan / keluarga inti — masa depan mereka bergantung ke saya.', skor_value: 2, urutan: 2 },
  { id: 'o4_3', question_id: 'q4', label_text: 'C) Orang tua / saudara — mereka bergantung pada bantuan saya.', skor_value: 3, urutan: 3 },
  { id: 'o4_4', question_id: 'q4', label_text: 'D) Semua di atas — pasangan, anak, DAN orang tua/saudara bergantung ke saya.', skor_value: 4, urutan: 4 },

  // Options for Q5
  { id: 'o5_1', question_id: 'q5', label_text: 'A) Kehilangan pekerjaan / sumber penghasilan secara tiba-tiba.', skor_value: 1, urutan: 1 },
  { id: 'o5_2', question_id: 'q5', label_text: 'B) Terkena risiko kesehatan / penyakit kritis yang butuh biaya pengobatan besar.', skor_value: 2, urutan: 2 },
  { id: 'o5_3', question_id: 'q5', label_text: 'C) Meninggal mendadak dan keluarga ditinggalkan tanpa pendapatan.', skor_value: 3, urutan: 3 },
  { id: 'o5_4', question_id: 'q5', label_text: 'D) Salah kelola keuangan sehingga masa depan keluarga tidak terjamin.', skor_value: 4, urutan: 4 },

  // Options for Q6
  { id: 'o6_1', question_id: 'q6', label_text: 'A) Sangat lengkap — Sudah ada dana dana darurat, asuransi jiwa, kesehatan, & penyakit kritis.', skor_value: 1, urutan: 1 },
  { id: 'o6_2', question_id: 'q6', label_text: 'B) Cukup lengkap — Sudah ada asuransi dasar, tapi rasa masih ada celah.', skor_value: 2, urutan: 2 },
  { id: 'o6_3', question_id: 'q6', label_text: 'C) Kurang lengkap — Hanya punya asuransi dari kantor atau BPJS saja.', skor_value: 3, urutan: 3 },
  { id: 'o6_4', question_id: 'q6', label_text: 'D) Belum ada sama sekali — Belum jadi prioritas sejauh ini.', skor_value: 4, urutan: 4 }
];

const DEFAULT_MODULES: Module[] = [
  { id: 'm1', judul: 'Samoia Core Sales Principles - Volume 1', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', urutan: 1 },
  { id: 'm2', judul: 'Dynamic Financial Assessment Framework Integration', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', urutan: 2 },
  { id: 'm3', judul: 'Closing High-Net-Worth Prospects with Wealth Snapshots', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', urutan: 3 }
];

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      leads: [],
      assessment_questions: [],
      assessment_options: [],
      modules: [],
      module_progress: [],
      calendar_bookings: [],
      settings: [],
      audit_logs: []
    };
    this.load();
    this.seed();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error('Error loading database, re-initializing empty:', error);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  private seed() {
    let changed = false;

    // Seed admin if no users
    if (this.data.users.length === 0) {
      this.data.users.push({
        id: 'admin-id',
        email: 'bxma.info@gmail.com',
        password_hash: 'admin1203$', // Simple fallback password
        nama: 'Admin Samoia',
        role: 'admin',
        status_akun: 'aktif',
        status_sertifikasi: 'lulus',
        referral_code: 'ADMIN',
        created_at: new Date().toISOString()
      });
      changed = true;
    }

    // Seed settings
    for (const s of DEFAULT_SETTINGS) {
      if (!this.data.settings.find(item => item.key === s.key)) {
        this.data.settings.push(s);
        changed = true;
      }
    }

    // Always sync assessment questions & options to match the latest template
    this.data.assessment_questions = [...DEFAULT_QUESTIONS];
    this.data.assessment_options = [...DEFAULT_OPTIONS];
    changed = true;

    // Seed modules
    if (this.data.modules.length === 0) {
      this.data.modules = [...DEFAULT_MODULES];
      changed = true;
    }

    if (changed) {
      this.save();
    }
  }

  // Generic and Custom table operations
  getUsers() { return this.data.users; }
  getLeads() { return this.data.leads; }
  getQuestions() { return this.data.assessment_questions; }
  getOptions() { return this.data.assessment_options; }
  getModules() { return this.data.modules; }
  getProgress() { return this.data.module_progress; }
  getBookings() { return this.data.calendar_bookings; }
  getSettings() { return this.data.settings; }
  getAuditLogs() { return this.data.audit_logs; }

  // User Actions
  addUser(user: User) {
    this.data.users.push(user);
    this.save();
  }

  updateUser(id: string, updates: Partial<User>) {
    const user = this.data.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updates);
      this.save();
      return user;
    }
    return null;
  }

  // Lead Actions
  addLead(lead: Lead) {
    this.data.leads.push(lead);
    this.save();
  }

  updateLead(id: string, updates: Partial<Lead>) {
    const lead = this.data.leads.find(l => l.id === id);
    if (lead) {
      Object.assign(lead, updates);
      this.save();
      return lead;
    }
    return null;
  }

  deleteLead(id: string) {
    this.data.leads = this.data.leads.filter(l => l.id !== id);
    // Also remove any bookings associated with this lead
    this.data.calendar_bookings = this.data.calendar_bookings.filter(b => b.lead_id !== id);
    this.save();
  }

  // Settings Actions
  updateSetting(key: string, value: string) {
    const setting = this.data.settings.find(s => s.key === key);
    if (setting) {
      setting.value = value;
    } else {
      this.data.settings.push({ key, value });
    }
    this.save();
  }

  // Assessment CRUD
  addQuestion(q: AssessmentQuestion) {
    this.data.assessment_questions.push(q);
    this.save();
  }

  updateQuestion(id: string, updates: Partial<AssessmentQuestion>) {
    const q = this.data.assessment_questions.find(item => item.id === id);
    if (q) {
      Object.assign(q, updates);
      q.updated_at = new Date().toISOString();
      this.save();
      return q;
    }
    return null;
  }

  deleteQuestion(id: string) {
    this.data.assessment_questions = this.data.assessment_questions.filter(q => q.id !== id);
    this.data.assessment_options = this.data.assessment_options.filter(o => o.question_id !== id);
    this.save();
  }

  setOptions(questionId: string, options: AssessmentOption[]) {
    // Delete existing options
    this.data.assessment_options = this.data.assessment_options.filter(o => o.question_id !== questionId);
    // Add new ones
    this.data.assessment_options.push(...options);
    this.save();
  }

  // Modules CRUD
  addModule(m: Module) {
    this.data.modules.push(m);
    this.save();
  }

  updateModule(id: string, updates: Partial<Module>) {
    const m = this.data.modules.find(item => item.id === id);
    if (m) {
      Object.assign(m, updates);
      this.save();
      return m;
    }
    return null;
  }

  deleteModule(id: string) {
    this.data.modules = this.data.modules.filter(m => m.id !== id);
    this.data.module_progress = this.data.module_progress.filter(p => p.module_id !== id);
    this.save();
  }

  // Progress tracking
  toggleProgress(userId: string, moduleId: string, completed: boolean) {
    if (completed) {
      const exists = this.data.module_progress.find(p => p.user_id === userId && p.module_id === moduleId);
      if (!exists) {
        this.data.module_progress.push({
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          user_id: userId,
          module_id: moduleId,
          completed_at: new Date().toISOString()
        });
        this.save();
      }
    } else {
      this.data.module_progress = this.data.module_progress.filter(p => !(p.user_id === userId && p.module_id === moduleId));
      this.save();
    }
  }

  // Bookings
  addBooking(booking: CalendarBooking) {
    this.data.calendar_bookings.push(booking);
    this.save();
  }

  updateBookingStatus(id: string, status: CalendarBooking['status']) {
    const booking = this.data.calendar_bookings.find(b => b.id === id);
    if (booking) {
      booking.status = status;
      this.save();
      return booking;
    }
    return null;
  }

  // Audit Trails
  addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString()
    };
    this.data.audit_logs.unshift(newLog); // newer first
    this.save();
  }
}

let dbInstance: Database | null = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

export const db = getDatabase();
