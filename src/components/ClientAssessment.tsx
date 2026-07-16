/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Check, ArrowRight, ArrowLeft, Calendar, Info, 
  HelpCircle, AlertTriangle, User, Phone, Briefcase, Users, 
  DollarSign, Landmark, Heart, Clock, Sparkles, AlertCircle
} from 'lucide-react';

interface ClientAssessmentProps {
  referralCode: string;
}

export default function ClientAssessment({ referralCode }: ClientAssessmentProps) {
  // Config & Sales State
  const [sales, setSales] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Step State
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Form Input States
  const [nama, setNama] = useState(() => localStorage.getItem('samoia_nama') || '');
  const [whatsapp, setWhatsapp] = useState(() => localStorage.getItem('samoia_whatsapp') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('samoia_email') || '');
  const [tanggalLahir, setTanggalLahir] = useState(() => localStorage.getItem('samoia_tanggalLahir') || '');
  const [statusPernikahan, setStatusPernikahan] = useState(() => localStorage.getItem('samoia_statusPernikahan') || 'Lajang');
  const [pekerjaan, setPekeraan] = useState(() => localStorage.getItem('samoia_pekerjaan') || '');
  const [jumlahTanggungan, setJumlahTanggungan] = useState(() => Number(localStorage.getItem('samoia_jumlahTanggungan')) || 0);
  const [adaTanggunganLain, setAdaTanggunganLain] = useState(() => localStorage.getItem('samoia_adaTanggunganLain') || 'Tidak');
  const [income, setIncome] = useState(() => localStorage.getItem('samoia_income') || '');
  const [expenses, setExpenses] = useState(() => localStorage.getItem('samoia_expenses') || '');
  const [debt, setDebt] = useState(() => localStorage.getItem('samoia_debt') || '');
  const [emergencyFund, setEmergencyFund] = useState(() => localStorage.getItem('samoia_emergencyFund') || '');
  const [proteksiExisting, setProteksiExisting] = useState<string[]>(() => JSON.parse(localStorage.getItem('samoia_proteksiExisting') || '[]'));
  
  // Dynamic Answers: Record<questionId, optionId>
  const [jawabanRaw, setJawabanRaw] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem('samoia_jawabanRaw') || '{}'));
  const [skorPrediksiDiri, setSkorPrediksiDiri] = useState<number>(() => Number(localStorage.getItem('samoia_skorPrediksiDiri')) || 20); // default Rentan equivalent
  
  // Persist changes
  useEffect(() => {
    localStorage.setItem('samoia_nama', nama);
    localStorage.setItem('samoia_whatsapp', whatsapp);
    localStorage.setItem('samoia_email', email);
    localStorage.setItem('samoia_tanggalLahir', tanggalLahir);
    localStorage.setItem('samoia_statusPernikahan', statusPernikahan);
    localStorage.setItem('samoia_pekerjaan', pekerjaan);
    localStorage.setItem('samoia_jumlahTanggungan', jumlahTanggungan.toString());
    localStorage.setItem('samoia_adaTanggunganLain', adaTanggunganLain);
    localStorage.setItem('samoia_income', income);
    localStorage.setItem('samoia_expenses', expenses);
    localStorage.setItem('samoia_debt', debt);
    localStorage.setItem('samoia_emergencyFund', emergencyFund);
    localStorage.setItem('samoia_proteksiExisting', JSON.stringify(proteksiExisting));
    localStorage.setItem('samoia_jawabanRaw', JSON.stringify(jawabanRaw));
    localStorage.setItem('samoia_skorPrediksiDiri', skorPrediksiDiri.toString());
    localStorage.setItem('samoia_bookingDate', bookingDate);
    localStorage.setItem('samoia_bookingTime', bookingTime);
    localStorage.setItem('samoia_honeypot', honeypot);
    localStorage.setItem('samoia_consent', consent.toString());
    localStorage.setItem('samoia_step', step.toString());
  }, [nama, whatsapp, email, tanggalLahir, statusPernikahan, pekerjaan, jumlahTanggungan, adaTanggunganLain, income, expenses, debt, emergencyFund, proteksiExisting, jawabanRaw, skorPrediksiDiri, bookingDate, bookingTime, honeypot, consent, step]);

  const clearAssessmentStorage = () => {
    localStorage.removeItem('samoia_nama');
    localStorage.removeItem('samoia_whatsapp');
    localStorage.removeItem('samoia_email');
    localStorage.removeItem('samoia_tanggalLahir');
    localStorage.removeItem('samoia_statusPernikahan');
    localStorage.removeItem('samoia_pekerjaan');
    localStorage.removeItem('samoia_jumlahTanggungan');
    localStorage.removeItem('samoia_adaTanggunganLain');
    localStorage.removeItem('samoia_income');
    localStorage.removeItem('samoia_expenses');
    localStorage.removeItem('samoia_debt');
    localStorage.removeItem('samoia_emergencyFund');
    localStorage.removeItem('samoia_proteksiExisting');
    localStorage.removeItem('samoia_jawabanRaw');
    localStorage.removeItem('samoia_skorPrediksiDiri');
    localStorage.removeItem('samoia_bookingDate');
    localStorage.removeItem('samoia_bookingTime');
    localStorage.removeItem('samoia_honeypot');
    localStorage.removeItem('samoia_consent');
    localStorage.removeItem('samoia_step');
    localStorage.removeItem('samoia_ref_code'); // Also clear ref code
  };

  // Submission State & Result Report
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fetch assessment configuration
  useEffect(() => {
    fetch(`/api/assessment/config?ref=${referralCode}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.error || 'Gagal memuat konfigurasi') });
        }
        return res.json();
      })
      .then(data => {
        setSales(data.sales);
        setQuestions(data.questions);
        setOptions(data.options);
        setSettings(data.settings);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [referralCode]);

  const toggleProtection = (type: string) => {
    if (proteksiExisting.includes(type)) {
      setProteksiExisting(proteksiExisting.filter(t => t !== type));
    } else {
      setProteksiExisting([...proteksiExisting, type]);
    }
  };

  const handleNextStep = () => {
    // Basic validation
    if (step === 1) {
      if (!nama || !whatsapp || !email || !tanggalLahir || !statusPernikahan || !pekerjaan) {
        alert('Mohon isi semua field data diri');
        return;
      }
    }
    if (step === 2) {
      if (jumlahTanggungan === undefined || jumlahTanggungan === null || !adaTanggunganLain) {
        alert('Mohon isi jumlah anak/tanggungan');
        return;
      }
    }
    if (step === 3) {
      if (!income || !expenses || !debt || !emergencyFund) {
        alert('Mohon lengkapi seluruh isian kondisi finansial Anda');
        return;
      }
    }
    if (step === 4) {
      // Allow empty protections, proceed freely
    }
    if (step === 5) {
      // Ensure all active questions have answers
      const unanswered = questions.some(q => !jawabanRaw[q.id]);
      if (unanswered) {
        alert('Mohon jawab seluruh pertanyaan penilaian untuk melanjutkannya');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      alert('Anda harus memberikan persetujuan PDP untuk mengirimkan analisis ini.');
      return;
    }
    if (!bookingDate || !bookingTime) {
      alert('Mohon pilih tanggal dan waktu konsultasi Zoom yang Anda inginkan.');
      return;
    }

    const isSelectedDayInvalid = bookingDate && sales?.schedule_availability?.days && !sales.schedule_availability.days.includes(new Date(bookingDate + 'T12:00:00').getDay());
    if (isSelectedDayInvalid) {
      const names = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const availableStr = sales.schedule_availability.days.map((n: number) => names[n]).join(', ');
      alert(`Advisor Anda tidak memiliki ketersediaan pada hari tersebut. Silakan pilih hari lain: ${availableStr}.`);
      return;
    }

    setSubmitting(true);

    const payload = {
      sales_id: sales.id,
      nama_calon_nasabah: nama,
      whatsapp,
      email,
      tanggal_lahir: tanggalLahir,
      status_pernikahan: statusPernikahan,
      pekerjaan,
      jumlah_tanggungan: Number(jumlahTanggungan),
      kondisi_finansial: {
        income,
        expenses,
        debt,
        emergency_fund: emergencyFund,
        ada_tanggungan_lain: adaTanggunganLain
      },
      proteksi_existing: proteksiExisting,
      jawaban_raw: jawabanRaw,
      skor_prediksi_diri: Number(skorPrediksiDiri),
      booking_time: `${bookingDate}T${bookingTime}:00`,
      honeypot
    };

    try {
      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat mengirim penilaian');
      }
      setResult(data.result);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Format IDR Currency
  const formatIDR = (num: number | string) => {
    const val = Number(num);
    if (isNaN(val)) return 'Rp 0';
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#F5F5F5] selection:bg-white selection:text-black">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border border-white/20 border-t-white rounded-none animate-spin mx-auto"></div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/40">LOADING ANALYSIS CONFIGURATION...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#F5F5F5] px-4 selection:bg-white selection:text-black">
        <div className="max-w-md w-full border border-red-500/30 bg-red-950/5 p-8 rounded-none text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-white">SISTEM CONFIGURATION ERROR</h2>
            <p className="text-white/40 text-[10px] uppercase font-mono tracking-wider mt-1">{error}</p>
          </div>
          <div className="bg-[#0A0A0A] border border-white/10 p-4 rounded-none text-[9px] text-left font-mono text-white/40 leading-relaxed uppercase tracking-wider">
            Harap hubungi sales advisor Anda untuk mendapatkan tautan referral kode yang valid (contoh: ?ref=BIMA482).
          </div>
        </div>
      </div>
    );
  }

  // Admin Controlled Server Status Block
  if (settings && settings.server_status && settings.server_status !== 'online') {
    const isOffline = settings.server_status === 'offline';
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#F5F5F5] px-4 selection:bg-white selection:text-black">
        <div className="max-w-md w-full border border-white/10 bg-[#0A0A0A] p-8 rounded-none text-center space-y-6 relative">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20"></div>

          <div className="space-y-2">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] block">SISTEM DIKONTROL ADMIN</span>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white">
              {isOffline ? 'PORTAL OFFLINE' : 'PEMELIHARAAN SISTEM'}
            </h2>
            <p className="text-white/50 text-[10px] leading-relaxed font-sans uppercase tracking-wider">
              {isOffline 
                ? 'Sistem penangkapan leads saat ini dinonaktifkan sementara oleh administrator.' 
                : 'Sistem sedang menjalani pemeliharaan terjadwal untuk peningkatan performa.'}
            </p>
          </div>

          <div className="border border-white/5 bg-white/[0.02] p-4 rounded-none text-[9px] text-left font-mono text-white/40 leading-relaxed uppercase tracking-widest">
            {isOffline 
              ? 'Silakan coba kembali dalam beberapa saat lagi atau hubungi advisor Anda.' 
              : 'Kami akan segera kembali online. Hubungi financial advisor Anda jika ada pertanyaan darurat.'}
          </div>

          {sales && (
            <div className="border-t border-white/10 pt-4 flex flex-col items-center justify-center space-y-2">
              <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">ASOSIASI ADVISOR ANDA</span>
              <div className="flex items-center gap-2">
                {sales.avatar_url ? (
                  <img src={sales.avatar_url} alt={sales.nama} className="w-8 h-8 rounded-full object-cover border border-white/20 grayscale" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-white/60">
                    {sales.nama?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider block">{sales.nama}</span>
                  <span className="text-[8px] font-mono text-white/40 uppercase block">Certified Financial Advisor</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If successfully submitted, show Premium Success Screen (No results shown to client!)
  if (result) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#F5F5F5] py-16 px-4 sm:px-6 selection:bg-white selection:text-black">
        <div className="max-w-2xl mx-auto border border-white/10 bg-[#0A0A0A] p-8 sm:p-12 rounded-none relative space-y-8 animate-fade-in">
          {/* Accent thin indicator */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white"></div>

          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-none text-white/40 text-[9px] font-mono uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> SECURE DOSSIER TRANSMITTED
            </div>
            <h1 className="text-2xl font-light uppercase tracking-widest text-white mt-1">Assessment Selesai</h1>
            <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest max-w-md mx-auto">
              Terima kasih, <span className="text-white font-semibold">{nama}</span>. Neraca risiko dan data finansial Anda telah berhasil dienkripsi secara aman.
            </p>
          </div>

          {/* Secure Message Placeholder (Hiding actual statistics) */}
          <div className="border border-white/10 bg-white/5 p-6 rounded-none text-center space-y-3">
            <Check className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-white">DATABASE DIENKRIPSI SECARA AMAN</h3>
            <p className="text-white/40 text-[10px] font-sans leading-relaxed max-w-lg mx-auto">
              Sesuai kebijakan perlindungan data pribadi (PDP) Samoia Consulting, hasil kalkulasi indeks perlindungan finansial Anda bersifat konfidensial dan tidak dirilis di browser umum. 
              Dokumen analisis komprehensif Anda telah dikirimkan langsung ke advisor pribadi Anda untuk dipresentasikan secara tatap muka pada sesi Zoom Anda.
            </p>
          </div>

          {/* Calendar Zoom Confirmation Details */}
          <div className="border border-white/10 bg-[#050505] p-6 rounded-none">
            <h4 className="text-xs font-mono text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white/60" /> Konfirmasi Sesi Strategis Privat Anda
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-white/5 border border-white/10 p-4 rounded-none">
                <span className="text-white/40 text-[9px] block uppercase tracking-widest">PERSONAL ADVISOR:</span>
                <span className="font-semibold text-white block mt-1 text-[11px] uppercase tracking-wider">{sales.nama}</span>
                <span className="text-white/40 text-[10px] block">{sales.email}</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-none">
                <span className="text-white/40 text-[9px] block uppercase tracking-widest">WAKTU PERTEMUAN (ZOOM):</span>
                <span className="font-semibold text-white block mt-1 text-[11px] uppercase tracking-wider">
                  {new Date(`${bookingDate}T${bookingTime}`).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="text-white/60 text-[10px] block">Pukul {bookingTime} WIB</span>
              </div>
            </div>
            <p className="text-white/40 text-[10px] font-mono mt-4 leading-relaxed uppercase tracking-wider">
              *Tautan Zoom Meeting privat Anda telah dikonfirmasi dan dimasukkan ke dalam antrean. Consultant Anda akan menghubungi Anda di WhatsApp ({whatsapp}) sebelum sesi dimulai untuk mengirim tautan Zoom.
            </p>
          </div>

          {/* Close Banner / Corporate Trust Footnote */}
          <div className="text-center pt-6 border-t border-white/10 text-white/30 text-[9px] font-mono uppercase tracking-widest">
            <p>SAMOIA CONSULTING PARTNERSHIP © 2026. ALL RIGHTS RESERVED.</p>
            <p className="mt-1">Trusted product providers: Allianz & Vision Group partners.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] py-16 px-4 sm:px-6 relative selection:bg-white selection:text-black">
      
      <div className="max-w-2xl mx-auto relative z-10">
        
        {/* Top Samoia Branding Title */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-none text-white/40 text-[9px] font-mono uppercase tracking-widest">
            <Shield className="w-3 h-3 text-white/60" /> Private Consultation Access
          </div>
          <h1 className="text-3xl font-light uppercase tracking-widest text-white mt-1">
            {settings.assessment_judul || 'Samoia Consulting'}
          </h1>
          <p className="text-white/40 text-[10px] uppercase font-mono tracking-widest leading-relaxed max-w-lg mx-auto">
            {settings.assessment_subheadline || 'Kalkulasi kesiapan finansial dan mitigasi risiko Anda secara dinamis.'}
          </p>
          
          {/* Sales rep card indicator */}
          <div className="inline-flex items-center gap-2 mt-4 bg-[#0A0A0A] border border-white/10 px-4 py-1.5 rounded-none text-[10px] font-mono tracking-widest uppercase">
            <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse"></div>
            <span className="text-white/40">ADVISOR:</span>
            <span className="text-white font-semibold">{sales.nama}</span>
          </div>
        </div>

        {/* Progress Tracker Steps Indicator */}
        <div className="mb-8 bg-[#0A0A0A] border border-white/10 p-4 rounded-none flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/40 uppercase tracking-widest">PROGRES:</span>
            <span className="text-[10px] uppercase tracking-wider text-white">Langkah {step} dari {totalSteps}</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-none transition-all duration-300 ${
                  index + 1 <= step ? 'w-6 bg-white' : 'w-2 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Outer Form Container */}
        <form onSubmit={handleSubmit} className="border border-white/10 bg-[#0A0A0A] p-6 sm:p-10 rounded-none space-y-6">
          
          {/* Honeypot Spam Prevention field - hidden via absolute & opacity */}
          <div className="absolute top-0 left-0 h-0 w-0 opacity-0 overflow-hidden pointer-events-none">
            <input 
              type="text" 
              name="honeypot" 
              value={honeypot} 
              onChange={(e) => setHoneypot(e.target.value)} 
              placeholder="Leave this empty" 
            />
          </div>

          <AnimatePresence mode="wait">
            
            {/* STEP 1: Data Diri Utama */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white">Langkah 1: Identitas Pribadi</h3>
                  <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Silakan isikan detail identitas Anda untuk pencatatan profile.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Nama Lengkap Calon Nasabah <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-sans"
                      placeholder="Contoh: Budi Gunawan"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> No. WhatsApp Aktif <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                      placeholder="Contoh: 081234567890"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                    <p className="text-white/30 text-[9px] font-mono uppercase tracking-wider mt-1">Digunakan oleh Sales Advisor untuk koordinasi link Zoom.</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      Alamat Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                      placeholder="Contoh: budi@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-white/30 text-[9px] font-mono uppercase tracking-wider mt-1">Untuk mengirimkan Dossier (Laporan) hasil assessment.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                        Tanggal Lahir <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                        value={tanggalLahir}
                        onChange={(e) => setTanggalLahir(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                        Status Pernikahan <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                        value={statusPernikahan}
                        onChange={(e) => setStatusPernikahan(e.target.value)}
                      >
                        <option value="Lajang" className="bg-[#050505]">Lajang</option>
                        <option value="Menikah" className="bg-[#050505]">Menikah</option>
                        <option value="Cerai Hidup" className="bg-[#050505]">Cerai Hidup</option>
                        <option value="Cerai Mati" className="bg-[#050505]">Cerai Mati</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3" /> Pekerjaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-sans"
                      placeholder="Contoh: Karyawan Swasta, Wiraswasta, Dokter, PNS"
                      value={pekerjaan}
                      onChange={(e) => setPekeraan(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Section 2 - Tanggungan */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white">Langkah 2: Tanggungan</h3>
                  <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Beban tanggungan menentukan ukuran ideal mitigasi risiko pendapatan Anda.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Jumlah Anak / Tanggungan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                      value={jumlahTanggungan}
                      onChange={(e) => setJumlahTanggungan(Math.max(0, Number(e.target.value)))}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                      Ada tanggungan lain? (orang tua, dll) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                      value={adaTanggunganLain}
                      onChange={(e) => setAdaTanggunganLain(e.target.value)}
                    >
                      <option value="Tidak" className="bg-[#050505]">Tidak Ada</option>
                      <option value="Ya" className="bg-[#050505]">Ya, Ada (Orang tua / Saudara / Lainnya)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Section 3 - Kondisi Finansial (Range-based) */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white">Langkah 3: Kondisi Finansial</h3>
                  <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Kami menggunakan rentang nilai (range) agar kenyamanan data privasi Anda tetap terjaga.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3" /> Penghasilan Bulanan (Range) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                    >
                      <option value="" className="bg-[#050505]">Pilih Rentang Penghasilan</option>
                      <option value="<5jt" className="bg-[#050505]">&lt; 5 Juta / Bulan</option>
                      <option value="5-10jt" className="bg-[#050505]">5 - 10 Juta / Bulan</option>
                      <option value="10-25jt" className="bg-[#050505]">10 - 25 Juta / Bulan</option>
                      <option value="25-50jt" className="bg-[#050505]">25 - 50 Juta / Bulan</option>
                      <option value="50-80jt" className="bg-[#050505]">50 - 80 Juta / Bulan</option>
                      <option value="80-100jt" className="bg-[#050505]">80 - 100 Juta / Bulan</option>
                      <option value=">100jt" className="bg-[#050505]">&gt; 100 Juta / Bulan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                      Pengeluaran Bulanan Rutin (Range) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                      value={expenses}
                      onChange={(e) => setExpenses(e.target.value)}
                    >
                      <option value="" className="bg-[#050505]">Pilih Rentang Pengeluaran</option>
                      <option value="<5jt" className="bg-[#050505]">&lt; 5 Juta / Bulan</option>
                      <option value="5-10jt" className="bg-[#050505]">5 - 10 Juta / Bulan</option>
                      <option value="10-25jt" className="bg-[#050505]">10 - 25 Juta / Bulan</option>
                      <option value="25-50jt" className="bg-[#050505]">25 - 50 Juta / Bulan</option>
                      <option value="50-80jt" className="bg-[#050505]">50 - 80 Juta / Bulan</option>
                      <option value="80-100jt" className="bg-[#050505]">80 - 100 Juta / Bulan</option>
                      <option value=">100jt" className="bg-[#050505]">&gt; 100 Juta / Bulan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Landmark className="w-3 h-3" /> Cicilan / Utang Aktif? <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                      value={debt}
                      onChange={(e) => setDebt(e.target.value)}
                    >
                      <option value="" className="bg-[#050505]">Pilih Status Utang/Cicilan</option>
                      <option value="Tidak" className="bg-[#050505]">Tidak Ada Utang Aktif</option>
                      <option value="Ya, <2jt/bulan" className="bg-[#050505]">Ya, &lt; 2 Juta / Bulan</option>
                      <option value="Ya, 2-5jt/bulan" className="bg-[#050505]">Ya, 2 - 5 Juta / Bulan</option>
                      <option value="Ya, 5-10jt/bulan" className="bg-[#050505]">Ya, 5 - 10 Juta / Bulan</option>
                      <option value="Ya, >10jt/bulan" className="bg-[#050505]">Ya, &gt; 10 Juta / Bulan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">
                      Dana Darurat Setara Berapa Bulan Pengeluaran? <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-none px-4 py-2.5 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                      value={emergencyFund}
                      onChange={(e) => setEmergencyFund(e.target.value)}
                    >
                      <option value="" className="bg-[#050505]">Pilih Ketersediaan Dana Darurat</option>
                      <option value="0" className="bg-[#050505]">0 Bulan (Belum Ada Dana Darurat)</option>
                      <option value="<3 bulan" className="bg-[#050505]">&lt; 3 Bulan Pengeluaran</option>
                      <option value="3-6 bulan" className="bg-[#050505]">3 - 6 Bulan Pengeluaran</option>
                      <option value=">6 bulan" className="bg-[#050505]">&gt; 6 Bulan Pengeluaran</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Section 4 - Proteksi Existing */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white">Langkah 4: Kepemilikan Proteksi Existing</h3>
                  <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Pilih produk asuransi atau perlindungan finansial yang sudah Anda miliki saat ini (Multi-select).</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    'Kesehatan',
                    'Santunan Penyakit Kritis (Cash Benefit)',
                    'Jiwa',
                    'Belum punya sama sekali'
                  ].map((type) => {
                    const selected = proteksiExisting.includes(type);
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => toggleProtection(type)}
                        className={`p-4 rounded-none border text-left transition-all text-xs flex items-center justify-between cursor-pointer ${
                          selected
                            ? 'bg-white text-black border-white font-medium'
                            : 'bg-white/5 text-white/40 border-white/10 hover:border-white hover:text-white'
                        }`}
                      >
                        <span className="font-sans font-medium">{type}</span>
                        <div className={`w-4 h-4 rounded-none border flex items-center justify-center ${
                          selected ? 'border-black bg-black' : 'border-white/20'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 5: Dynamic Assessment Questions from CMS */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white">Langkah 5: Penilaian Finansial Khusus</h3>
                  <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Evaluasi komprehensif didasarkan pada bobot nilai dinamis dari model Samoia Consulting.</p>
                </div>

                <div className="space-y-6">
                  {questions.map((q, qIdx) => {
                    const qOptions = options.filter(o => o.question_id === q.id);
                    return (
                      <div key={q.id} className="border border-white/10 p-5 rounded-none bg-white/5">
                        <span className="text-white/30 text-[9px] font-mono block mb-2 uppercase tracking-widest">PERTANYAAN {qIdx + 1}</span>
                        <h4 className="text-xs font-medium mb-4 text-white uppercase tracking-wider">{q.pertanyaan_text}</h4>
                        
                        <div className="space-y-3">
                          {qOptions.map((opt) => {
                            const isSelected = jawabanRaw[q.id] === opt.id;
                            return (
                              <button
                                type="button"
                                key={opt.id}
                                onClick={() => {
                                  setJawabanRaw({ ...jawabanRaw, [q.id]: opt.id });
                                  if (q.scoring_group === 'prediksi_diri') {
                                    setSkorPrediksiDiri(opt.skor_value);
                                  }
                                }}
                                className={`w-full p-3.5 rounded-none border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-black border-white font-medium'
                                    : 'bg-white/5 text-white/40 border-white/10 hover:border-white hover:text-white'
                                }`}
                              >
                                <span className="font-sans">{opt.label_text}</span>
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 6: Zoom Booking & PDP Consent */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white">Langkah Terakhir: Penjadwalan & Persetujuan</h3>
                  <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mt-1">Sesi Zoom strategis bersifat wajib untuk merilis laporan penasihat ahli secara resmi.</p>
                </div>

                <div className="space-y-4">
                  {/* Calendar details */}
                  <div className="border border-white/10 p-5 rounded-none bg-white/5">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/40" /> Ketersediaan Sesi Konsultasi Advisor
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Tanggal Konsultasi</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                        />
                        {sales?.schedule_availability?.days && (
                          <p className="text-[9px] font-mono text-white/30 uppercase mt-1 leading-relaxed">
                            *Jadwal Aktif: {(() => {
                              const names = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                              return sales.schedule_availability.days.map((n: number) => names[n]).join(', ');
                            })()}
                          </p>
                        )}
                        {bookingDate && sales?.schedule_availability?.days && !sales.schedule_availability.days.includes(new Date(bookingDate + 'T12:00:00').getDay()) && (
                          <p className="text-[9px] font-mono text-rose-500 uppercase mt-1 leading-relaxed">
                            ❌ Advisor Tidak Tersedia Di Hari Ini!
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Waktu Konsultasi (WIB)</label>
                        <select
                          required
                          className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2 text-xs focus:outline-none focus:border-white transition-colors font-mono"
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                        >
                          <option value="" className="bg-[#050505]">Pilih Jam</option>
                          {sales?.schedule_availability?.slots && sales.schedule_availability.slots.length > 0 ? (
                            sales.schedule_availability.slots.map((slot: string) => {
                              const [hour, min] = slot.split(':');
                              const endHour = (parseInt(hour, 10) + 1).toString().padStart(2, '0');
                              const endTime = `${endHour}:${min}`;
                              return (
                                <option key={slot} value={slot} className="bg-[#050505]">
                                  {slot} - {endTime} WIB
                                </option>
                              );
                            })
                          ) : (
                            ['09:00', '11:00', '13:00', '15:00', '17:00'].map((slot) => {
                              const [hour, min] = slot.split(':');
                              const endHour = (parseInt(hour, 10) + 1).toString().padStart(2, '0');
                              const endTime = `${endHour}:${min}`;
                              return (
                                <option key={slot} value={slot} className="bg-[#050505]">
                                  {slot} - {endTime} WIB
                                </option>
                              );
                            })
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* PDP Compliance Consent Box */}
                  <div className="border border-white/10 p-5 rounded-none bg-white/5">
                    <h4 className="text-[9px] font-mono text-white/40 mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                      <Shield className="w-3.5 h-3.5 text-white/60" /> Regulasi Undang-Undang Perlindungan Data Pribadi (PDP)
                    </h4>
                    <p className="text-white/40 text-[10px] leading-relaxed mb-4 uppercase font-mono tracking-wider">
                      {settings.kebijakan_privasi || 'Kami menghormati kerahasiaan Anda sesuai Undang-Undang PDP. Data finansial Anda dijamin terenkripsi.'}
                    </p>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 accent-white"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                      />
                      <span className="text-xs text-zinc-300 font-sans select-none leading-relaxed">
                        Saya dengan sadar memberikan persetujuan eksplisit untuk memproses data saya dan membagi laporan analisis ini ke designated Samoia consultant. <span className="text-red-500">*</span>
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Form Action Wizard Buttons */}
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 border border-white/10 text-white/40 rounded-none hover:text-white hover:border-white transition-colors text-xs font-mono uppercase tracking-widest cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            ) : (
              <div /> // dummy space
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-5 py-3 bg-white text-black font-mono font-semibold text-xs tracking-widest uppercase rounded-none hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Lanjutkan <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !consent}
                className={`flex items-center gap-2 px-6 py-3 bg-white text-black font-mono font-semibold tracking-widest text-xs uppercase rounded-none transition-all ${
                  submitting || !consent 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:bg-zinc-200 cursor-pointer'
                }`}
              >
                {submitting ? 'MEMPROSES...' : 'KIRIM & DAPATKAN REKOMENDASI'}
              </button>
            )}
          </div>

        </form>

        {/* Dynamic Footer with partnerships */}
        <div className="text-center mt-12 text-white/30 text-[9px] font-mono uppercase tracking-widest leading-relaxed">
          <p>SAMOIA CONSULTING PARTNERSHIP — INTERNAL LEAD CAPTURE SYSTEM V2</p>
          <p className="mt-1">All insurance products and advisory benefits are hosted in partnership with Allianz & Vision Group Indonesia.</p>
        </div>

      </div>
    </div>
  );
}
