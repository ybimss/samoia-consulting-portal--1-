/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  nama: string;
  role: 'admin' | 'sales';
  status_akun: 'pending' | 'aktif' | 'nonaktif';
  status_sertifikasi: 'belum_lulus' | 'lulus';
  referral_code: string;
  web3forms_key?: string;
  avatar_url?: string;
  whatsapp_link?: string;
  schedule_availability?: {
    days: number[]; // e.g. [1, 2, 3, 4, 5] for Mon-Fri
    slots: string[]; // e.g. ['09:00', '11:00', etc]
  };
  created_at: string;
}

export interface Lead {
  id: string;
  sales_id: string;
  sales_nama?: string;
  nama_calon_nasabah: string;
  whatsapp: string;
  email?: string;
  tanggal_lahir: string;
  status_pernikahan: string;
  pekerjaan: string;
  jumlah_tanggungan: number;
  kondisi_finansial: {
    income: string | number;
    expenses: string | number;
    debt: string | number;
    emergency_fund: string | number;
    ada_tanggungan_lain?: string;
  };
  proteksi_existing: string[]; // array of protection types
  jawaban_assessment: Record<string, { question: string; answer: string; score: number }>; // JSON snapshot
  segmen_profesi: string;
  skor_aktual: number;
  skor_range_min: number;
  skor_range_max: number;
  skor_prediksi_diri: number;
  kategori_hasil: string;
  gap_kesadaran: string; // e.g. "Sesuai", "Over-confident", "Under-confident"
  status_crm: 'baru' | 'dihubungi' | 'qualified' | 'closed' | 'lost' | 'ghosting';
  consent_diberikan: boolean;
  consent_timestamp: string;
  created_at: string;
}

export interface AssessmentQuestion {
  id: string;
  pertanyaan_text: string;
  urutan: number;
  is_scored: boolean;
  scoring_group: string; // e.g., 'kategori_utama', 'prediksi_diri'
  status: 'aktif' | 'nonaktif';
  created_at: string;
  updated_at: string;
}

export interface AssessmentOption {
  id: string;
  question_id: string;
  label_text: string;
  skor_value: number;
  urutan: number;
}

export interface Module {
  id: string;
  judul: string;
  youtube_url: string;
  urutan: number;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  completed_at: string;
}

export interface CalendarBooking {
  id: string;
  sales_id: string;
  lead_id: string;
  google_event_id: string;
  waktu_booking: string;
  status: 'confirmed' | 'rescheduled' | 'dibatalkan' | 'no_show';
}

export interface Setting {
  key: string;
  value: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_nama: string;
  action_type: string;
  target_type: string;
  target_id: string;
  detail: Record<string, any>;
  created_at: string;
}
