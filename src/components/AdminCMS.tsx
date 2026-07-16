/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Check, X, ShieldAlert, Award, FileText, Settings, 
  Trash2, Plus, Edit2, Download, AlertTriangle, RefreshCw, 
  Eye, CornerDownRight, LogIn, ExternalLink, Calendar, HelpCircle,
  ChevronRight
} from 'lucide-react';
import { User, Lead, AssessmentQuestion, AssessmentOption, Module, Setting, AuditLog } from '../types';

interface AdminCMSProps {
  token: string;
  adminUser: User;
}

export default function AdminCMS({ token, adminUser }: AdminCMSProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'questions' | 'modules' | 'settings' | 'leads' | 'logs'>('users');
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<(Lead & { sales_nama: string })[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [options, setOptions] = useState<AssessmentOption[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // UI / Modals State
  const [loading, setLoading] = useState(true);
  const [reassignModal, setReassignModal] = useState<{ show: boolean; fromUserId: string; pendingCount: number }>({ show: false, fromUserId: '', pendingCount: 0 });
  const [targetReassignId, setTargetReassignId] = useState('');

  // Custom dialog states to bypass iframe confirm/prompt blocking
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [promptModal, setPromptModal] = useState<{
    show: boolean;
    title: string;
    value: string;
    onConfirm: (val: string) => void;
  }>({
    show: false,
    title: '',
    value: '',
    onConfirm: () => {}
  });
  
  // Question Form Modal
  const [questionModal, setQuestionModal] = useState<{ show: boolean; mode: 'add' | 'edit'; id?: string }>({ show: false, mode: 'add' });
  const [qText, setQText] = useState('');
  const [qIsScored, setQIsScored] = useState(true);
  const [qGroup, setQGroup] = useState('kategori_utama');
  const [qStatus, setQStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [qOptions, setQOptions] = useState<{ id?: string; label_text: string; skor_value: number }[]>([
    { label_text: '', skor_value: 10 },
    { label_text: '', skor_value: 20 },
    { label_text: '', skor_value: 30 },
    { label_text: '', skor_value: 40 }
  ]);

  // Module Form Modal
  const [moduleModal, setModuleModal] = useState<{ show: boolean; mode: 'add' | 'edit'; id?: string }>({ show: false, mode: 'add' });
  const [mTitle, setMTitle] = useState('');
  const [mUrl, setMUrl] = useState('');
  const [mOrder, setMOrder] = useState('');

  // Settings Temp Fields
  const [sJudul, setSJudul] = useState('');
  const [sSubheadline, setSSubheadline] = useState('');
  const [sPitch, setSPitch] = useState('');
  const [sPrivasi, setSPrivasi] = useState('');
  const [sDiscord, setSDiscord] = useState('');
  const [sServerStatus, setSServerStatus] = useState<'online' | 'offline' | 'maintenance'>('online');

  // Detailed Lead View Modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Fetch admin bundle
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [uRes, qRes, mRes, lRes, logRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/questions', { headers }),
        fetch('/api/admin/modules', { headers }),
        fetch('/api/admin/leads', { headers }),
        fetch('/api/admin/audit-logs', { headers })
      ]);

      const [uData, qData, mData, lData, logData] = await Promise.all([
        uRes.json(), qRes.json(), mRes.json(), lRes.json(), logRes.json()
      ]);

      setUsers(uData.users || []);
      setQuestions(qData.questions || []);
      setOptions(qData.options || []);
      setModules(mData.modules || []);
      setLeads(lData.leads || []);
      setAuditLogs(logData.auditLogs || []);

      // Pull setting fields from lead config request as well
      const configRes = await fetch(`/api/assessment/config?ref=ADMIN`);
      if (configRes.ok) {
        const configData = await configRes.json();
        const s = configData.settings || {};
        setSettings(s);
        setSJudul(s.assessment_judul || '');
        setSSubheadline(s.assessment_subheadline || '');
        setSPitch(s.teks_pitch || '');
        setSPrivasi(s.kebijakan_privasi || '');
        setSDiscord(s.discord_invite_link || '');
        setSServerStatus(s.server_status || 'online');
      }

    } catch (err) {
      console.error('Gagal memuat admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- ACTIONS ---

  // User Approval
  const handleApprove = (userId: string) => {
    setConfirmModal({
      show: true,
      title: 'SETUJUI AKUN SALES',
      message: 'Apakah Anda yakin ingin menyetujui akun sales ini? Kode referral unik akan otomatis diterbitkan.',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/users/approve', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gagal menyetujui akun');
          alert(data.message || 'Sales disetujui');
          fetchData();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  // Toggle Certification AAJI/AASI
  const handleToggleCert = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'lulus' ? 'belum_lulus' : 'lulus';
    try {
      const res = await fetch('/api/admin/users/certify', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status sertifikasi');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Deactivate Account
  const handleDeactivate = (userId: string) => {
    setConfirmModal({
      show: true,
      title: 'NONAKTIFKAN AKUN SALES',
      message: 'Apakah Anda yakin ingin menonaktifkan akun sales ini? Akun tidak akan bisa masuk/login.',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/users/deactivate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gagal menonaktifkan akun');
          
          if (data.pendingLeadsToReassign > 0) {
            // Show reassignment modal immediately!
            setReassignModal({
              show: true,
              fromUserId: userId,
              pendingCount: data.pendingLeadsToReassign
            });
          } else {
            alert('Akun berhasil dinonaktifkan.');
          }
          fetchData();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  // Override Referral Code
  const handleOverrideCode = (userId: string) => {
    setPromptModal({
      show: true,
      title: 'OVERRIDE KODE REFERRAL',
      value: '',
      onConfirm: async (code) => {
        if (!code.trim()) {
          alert('Kode tidak boleh kosong');
          return;
        }
        try {
          const res = await fetch('/api/admin/users/update-code', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, newCode: code.toUpperCase() })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gagal override kode');
          alert(data.message);
          fetchData();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  // Execute Reassignment
  const handleExecuteReassign = async () => {
    if (!targetReassignId) {
      alert('Pilih sales tujuan terlebih dahulu');
      return;
    }
    try {
      const res = await fetch('/api/admin/users/reassign-leads', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSalesId: reassignModal.fromUserId,
          toSalesId: targetReassignId
        })
      });
      const data = await res.json();
      alert(data.message);
      setReassignModal({ show: false, fromUserId: '', pendingCount: 0 });
      setTargetReassignId('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CRUD QUESTIONS
  const handleOpenAddQuestion = () => {
    setQText('');
    setQIsScored(true);
    setQGroup('kategori_utama');
    setQStatus('aktif');
    setQOptions([
      { label_text: 'Sangat Rentan / < 1 bulan', skor_value: 10 },
      { label_text: 'Rentan / 1 - 3 bulan', skor_value: 20 },
      { label_text: 'Cukup Aman / 3 - 6 bulan', skor_value: 30 },
      { label_text: 'Sangat Aman / > 6 bulan', skor_value: 40 }
    ]);
    setQuestionModal({ show: true, mode: 'add' });
  };

  const handleOpenEditQuestion = (q: AssessmentQuestion) => {
    setQText(q.pertanyaan_text);
    setQIsScored(q.is_scored);
    setQGroup(q.scoring_group);
    setQStatus(q.status);
    
    const qOpts = options.filter(o => o.question_id === q.id).sort((a,b)=>a.urutan - b.urutan);
    setQOptions(qOpts.map(o => ({ id: o.id, label_text: o.label_text, skor_value: o.skor_value })));
    setQuestionModal({ show: true, mode: 'edit', id: q.id });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) {
      alert('Teks pertanyaan wajib diisi');
      return;
    }

    const payload = {
      pertanyaan_text: qText,
      is_scored: qIsScored,
      scoring_group: qGroup,
      status: qStatus,
      options: qOptions
    };

    try {
      const url = questionModal.mode === 'add' 
        ? '/api/admin/questions' 
        : `/api/admin/questions/${questionModal.id}`;
      
      const res = await fetch(url, {
        method: questionModal.mode === 'add' ? 'POST' : 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      alert(data.message);
      setQuestionModal({ show: false, mode: 'add' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    setConfirmModal({
      show: true,
      title: 'HAPUS PERTANYAAN ASSESSMENT',
      message: 'Apakah Anda yakin ingin menghapus pertanyaan ini beserta seluruh opsinya?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/questions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          alert(data.message);
          fetchData();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  // CRUD MODULES
  const handleOpenAddModule = () => {
    setMTitle('');
    setMUrl('');
    setMOrder(String(modules.length + 1));
    setModuleModal({ show: true, mode: 'add' });
  };

  const handleOpenEditModule = (m: Module) => {
    setMTitle(m.judul);
    setMUrl(m.youtube_url);
    setMOrder(String(m.urutan));
    setModuleModal({ show: true, mode: 'edit', id: m.id });
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle || !mUrl) {
      alert('Judul dan URL wajib diisi');
      return;
    }

    const payload = {
      judul: mTitle,
      youtube_url: mUrl,
      urutan: Number(mOrder) || 1
    };

    try {
      const url = moduleModal.mode === 'add' ? '/api/admin/modules' : `/api/admin/modules/${moduleModal.id}`;
      const res = await fetch(url, {
        method: moduleModal.mode === 'add' ? 'POST' : 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      alert(data.message);
      setModuleModal({ show: false, mode: 'add' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteModule = (id: string) => {
    setConfirmModal({
      show: true,
      title: 'HAPUS MODUL PEMBELAJARAN',
      message: 'Apakah Anda yakin ingin menghapus modul pembelajaran ini?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/modules/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          alert(data.message);
          fetchData();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  // SAVE SETTINGS
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_judul: sJudul,
          assessment_subheadline: sSubheadline,
          teks_pitch: sPitch,
          kebijakan_privasi: sPrivasi,
          discord_invite_link: sDiscord,
          server_status: sServerStatus
        })
      });
      const data = await res.json();
      alert(data.message);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // EXPORT ALL LEADS TO CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('Tidak ada data lead untuk diexport');
      return;
    }

    const headers = ['ID', 'Nama Lead', 'WhatsApp', 'Pekerjaan', 'Segmen', 'Skor Aktual', 'Kategori', 'Sales Advisor', 'Tanggal Masuk'];
    const rows = leads.map(l => [
      l.id,
      l.nama_calon_nasabah,
      l.whatsapp,
      l.pekerjaan,
      l.segmen_profesi,
      l.skor_aktual,
      l.kategori_hasil,
      l.sales_nama,
      new Date(l.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_samoia_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-400 font-mono text-xs">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" /> MEMUAT SISTEM ADMIN CMS...
      </div>
    );
  }

  return (
    <div className="bg-[#050505] border border-white/10 rounded-none overflow-hidden mt-6 text-[#F5F5F5] selection:bg-white selection:text-black">
      
      {/* Top Admin Section Banner */}
      <div className="bg-[#0A0A0A] p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-light tracking-widest text-white flex items-center gap-2 uppercase">
            <ShieldAlert className="w-5 h-5 text-white/80" /> CMS BACKPANEL
          </h2>
          <p className="text-white/40 text-[10px] uppercase font-mono tracking-wider mt-1">Kelola akun sales, parameter dynamic financial assessment, dan log aktivitas audit.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-white/5 border border-white/10 font-mono text-white/80 px-3 py-1.5 rounded-none uppercase tracking-widest">
            ROLE: {adminUser.nama} ({adminUser.role})
          </span>
        </div>
      </div>

      {/* Admin tabs navigation */}
      <div className="flex border-b border-white/10 bg-black/40 overflow-x-auto scroller-hidden">
        {[
          { key: 'users', label: 'Kelola Sales', icon: Users },
          { key: 'questions', label: 'Form Assessment', icon: HelpCircle },
          { key: 'modules', label: 'Modul Belajar', icon: Award },
          { key: 'settings', label: 'Copy & Pitch', icon: Settings },
          { key: 'leads', label: 'Semua Leads', icon: FileText },
          { key: 'logs', label: 'Audit Log', icon: ShieldAlert }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-4 text-xs font-mono border-b transition-all whitespace-nowrap cursor-pointer uppercase tracking-widest ${
                active 
                  ? 'border-white text-white bg-white/5 font-semibold' 
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        
        {/* TAB 1: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest">AKUN SALES PENASIHAT & STAFF</h3>
              <button onClick={fetchData} className="p-1.5 border border-white/10 rounded-none hover:border-white text-white/40 hover:text-white transition-colors cursor-pointer">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-none bg-[#050505]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A0A0A] text-white/40 font-mono uppercase text-[9px] tracking-widest border-b border-white/10">
                  <tr>
                    <th className="p-4 font-normal">Sales Representative</th>
                    <th className="p-4 font-normal">Email</th>
                    <th className="p-4 font-normal">Status Akun</th>
                    <th className="p-4 font-normal">Sertifikasi AAJI/AASI</th>
                    <th className="p-4 font-normal">Kode Referral</th>
                    <th className="p-4 font-normal text-right">Opsi Pengaturan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 text-zinc-300">
                      <td className="p-4 font-medium text-white flex items-center gap-2">
                        {u.nama} {u.role === 'admin' && <span className="text-[9px] bg-white/10 border border-white/10 text-white px-2 py-0.5 rounded-none uppercase font-mono tracking-wider">Admin</span>}
                      </td>
                      <td className="p-4 font-mono text-white/40">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-none text-[9px] font-mono border uppercase tracking-wider ${
                          u.status_akun === 'aktif' ? 'bg-white/10 text-white border-white/20' :
                          u.status_akun === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                          'bg-black text-white/30 border-white/5'
                        }`}>
                          {u.status_akun}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          disabled={u.role === 'admin'}
                          onClick={() => handleToggleCert(u.id, u.status_sertifikasi)}
                          className={`flex items-center gap-1.5 px-3 py-1 border rounded-none text-[9px] font-mono uppercase tracking-widest transition-colors cursor-pointer ${
                            u.status_sertifikasi === 'lulus' 
                              ? 'bg-white text-black border-white hover:bg-zinc-200' 
                              : 'bg-transparent text-white/30 border-white/10 hover:text-white hover:border-white'
                          }`}
                        >
                          <Award className="w-3 h-3" />
                          {u.status_sertifikasi === 'lulus' ? 'LULUS (MODULE OPEN)' : 'BELUM LULUS (LOCKED)'}
                        </button>
                      </td>
                      <td className="p-4">
                        {u.referral_code ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-none tracking-widest text-[10px]">{u.referral_code}</span>
                            {u.role !== 'admin' && (
                              <button onClick={() => handleOverrideCode(u.id)} className="text-white/40 hover:text-white transition-colors cursor-pointer">
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/20 font-mono text-[10px] uppercase tracking-widest">PENDING APPROVAL</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-2">
                            {u.status_akun === 'pending' && (
                              <button
                                onClick={() => handleApprove(u.id)}
                                className="px-3 py-1 bg-white text-black font-mono rounded-none hover:bg-zinc-200 text-[9px] flex items-center gap-1 uppercase tracking-widest cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Setujui
                              </button>
                            )}
                            {u.status_akun !== 'nonaktif' && (
                              <button
                                onClick={() => handleDeactivate(u.id)}
                                className="px-2.5 py-1 border border-white/10 hover:border-red-500 hover:bg-red-500/10 text-white/40 hover:text-red-400 rounded-none text-[9px] flex items-center gap-1 uppercase tracking-widest cursor-pointer transition-colors"
                              >
                                <X className="w-3 h-3" /> Matikan
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: QUESTIONS FLOW CRUD */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest">PARAMETER ASSESSMENT & BOBOT SKOR</h3>
                <p className="text-white/40 text-[10px] uppercase font-mono tracking-wider mt-1">Bobot skor akan mengkalkulasi kategori kelayakan calon nasabah secara real-time.</p>
              </div>
              <button
                onClick={handleOpenAddQuestion}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-black font-mono rounded-none text-[10px] hover:bg-zinc-200 transition-colors uppercase tracking-widest cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Soal
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const qOpts = options.filter(o => o.question_id === q.id).sort((a,b)=>a.urutan - b.urutan);
                return (
                  <div key={q.id} className="border border-white/10 bg-[#0A0A0A] p-5 rounded-none flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-white/20 transition-colors">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[9px] uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded-none text-white/40 tracking-wider">Urutan: {q.urutan}</span>
                        <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono border uppercase tracking-wider ${
                          q.is_scored ? 'bg-white text-black border-white' : 'bg-transparent text-white/30 border-white/10'
                        }`}>
                          {q.is_scored ? `Scored (${q.scoring_group})` : 'Prediction / Non-scored'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono border uppercase tracking-wider ${
                          q.status === 'aktif' ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/20 border-white/5'
                        }`}>
                          {q.status}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-medium uppercase tracking-wide text-white">{q.pertanyaan_text}</h4>
                      
                      {/* Options breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {qOpts.map(o => (
                          <div key={o.id} className="bg-white/5 border border-white/5 p-2.5 rounded-none flex items-center justify-between text-[11px] text-white/60">
                            <span>{o.label_text}</span>
                            <span className="font-mono text-white text-[10px] bg-white/10 border border-white/10 px-2 py-0.5 rounded-none">+{o.skor_value} Pts</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-start">
                      <button
                        onClick={() => handleOpenEditQuestion(q)}
                        className="p-1.5 border border-white/10 hover:border-white rounded-none text-white/40 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 border border-white/10 hover:border-red-500 rounded-none text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: MODULES MANAGEMENT */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest">MODUL TRAINING AGENT SALES (YOUTUBE)</h3>
                <p className="text-white/40 text-[10px] uppercase font-mono tracking-wider mt-1">Hanya agen sales yang berstatus "Lulus Sertifikasi" yang bisa membuka video ini di portal dashboard mereka.</p>
              </div>
              <button
                onClick={handleOpenAddModule}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-black font-mono rounded-none text-[10px] hover:bg-zinc-200 transition-colors uppercase tracking-widest cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Modul
              </button>
            </div>

            <div className="space-y-4">
              {modules.map(m => (
                <div key={m.id} className="border border-white/10 bg-[#0A0A0A] p-5 rounded-none flex items-center justify-between gap-6 hover:border-white/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded-none text-white/40 tracking-wider">Urutan: {m.urutan}</span>
                    </div>
                    <h4 className="text-sm font-medium uppercase tracking-wide text-white">{m.judul}</h4>
                    <p className="font-mono text-white/40 text-[10px] uppercase tracking-wider truncate max-w-lg">{m.youtube_url}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModule(m)}
                      className="p-1.5 border border-white/10 hover:border-white rounded-none text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(m.id)}
                      className="p-1.5 border border-white/10 hover:border-red-500 rounded-none text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CMS GLOBAL SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest">COPYWRITING & BRANDING PORTAL</h3>
              <p className="text-white/40 text-[10px] uppercase font-mono tracking-wider mt-1">Ubah teks statis, judul, dan pitch yang ditampilkan pada universal landing page lead capture.</p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Assessment Headline</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2.5 focus:outline-none focus:border-white transition-colors"
                  value={sJudul}
                  onChange={(e) => setSJudul(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Assessment Sub-headline</label>
                <textarea
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2.5 focus:outline-none focus:border-white transition-colors font-sans"
                  value={sSubheadline}
                  onChange={(e) => setSSubheadline(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Teks Pitch Rekomendasi (Setelah Hasil Terkalkulasi)</label>
                <textarea
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2.5 focus:outline-none focus:border-white transition-colors font-sans"
                  value={sPitch}
                  onChange={(e) => setSPitch(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Undang-Undang PDP Kebijakan Privasi (Di Atas Consent Checkbox)</label>
                <textarea
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2.5 focus:outline-none focus:border-white transition-colors font-sans"
                  value={sPrivasi}
                  onChange={(e) => setSPrivasi(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Tautan Undangan Discord Komunitas</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2.5 focus:outline-none focus:border-white transition-colors font-mono"
                  value={sDiscord}
                  onChange={(e) => setSDiscord(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">SYSTEM / SERVER STATUS CONTROL</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'online', label: 'ONLINE (NOMINAL)', desc: 'Sistem aktif penuh', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/10' },
                    { value: 'offline', label: 'OFFLINE', desc: 'Sistem dinonaktifkan', color: 'border-rose-500 text-rose-400 bg-rose-950/10' },
                    { value: 'maintenance', label: 'MAINTENANCE', desc: 'Pemeliharaan server', color: 'border-amber-500 text-amber-400 bg-amber-950/10' }
                  ].map((statusOpt) => {
                    const isSelected = sServerStatus === statusOpt.value;
                    return (
                      <button
                        key={statusOpt.value}
                        type="button"
                        onClick={() => setSServerStatus(statusOpt.value as any)}
                        className={`p-3 border text-left rounded-none transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected 
                            ? `${statusOpt.color} border-current ring-1 ring-current` 
                            : 'border-white/10 hover:border-white/30 text-white/50 bg-black/20'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider block">{statusOpt.label}</span>
                        <span className="text-[8px] text-white/40 font-mono mt-1 block uppercase">{statusOpt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-3 bg-white text-black font-mono rounded-none text-[10px] hover:bg-zinc-200 transition-colors uppercase tracking-widest cursor-pointer"
            >
              SIMPAN PENGATURAN CMS
            </button>
          </form>
        )}

        {/* TAB 5: LEADS LOGGING & EXPORT */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest">SNAPSHOT LEADS KESELURUHAN (ADMIN VIEW)</h3>
                <p className="text-white/40 text-[10px] uppercase font-mono tracking-wider mt-1">Sebagai admin, Anda dapat memantau seluruh lead calon nasabah yang masuk dari semua agen sales.</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 border border-white/10 hover:border-white text-white/60 hover:text-white font-mono rounded-none text-[10px] transition-colors cursor-pointer uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" /> Export ke CSV
              </button>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-none bg-[#050505]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A0A0A] text-white/40 font-mono uppercase text-[9px] tracking-widest border-b border-white/10">
                  <tr>
                    <th className="p-4 font-normal">Calon Nasabah</th>
                    <th className="p-4 font-normal">WhatsApp</th>
                    <th className="p-4 font-normal">Pekerjaan</th>
                    <th className="p-4 font-normal">Segmen</th>
                    <th className="p-4 font-normal">Skor Aktual</th>
                    <th className="p-4 font-normal">Hasil / Kategori</th>
                    <th className="p-4 font-normal">Sales Advisor Owner</th>
                    <th className="p-4 font-normal text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leads.map(l => (
                    <tr key={l.id} className="hover:bg-white/5 text-zinc-300">
                      <td className="p-4 font-medium text-white">{l.nama_calon_nasabah}</td>
                      <td className="p-4 font-mono text-white/40">{l.whatsapp}</td>
                      <td className="p-4 font-mono text-[11px] uppercase tracking-wider">{l.pekerjaan}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono border uppercase tracking-wider ${
                          l.segmen_profesi.includes('HNW') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {l.segmen_profesi}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-white">{l.skor_aktual} Pts</td>
                      <td className="p-4 font-mono text-[11px] uppercase tracking-wider">
                        <span className="font-semibold text-zinc-200">{l.kategori_hasil}</span>
                      </td>
                      <td className="p-4 font-mono text-white/40 text-[11px] uppercase tracking-wider">{l.sales_nama}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedLead(l)}
                          className="p-1.5 border border-white/10 hover:border-white text-white/40 hover:text-white rounded-none cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-white/30 font-mono tracking-widest text-[10px] uppercase">BELUM ADA DATA LEAD MASUK DI DATABASE</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT TRAIL LOG */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest">AUDIT TRAIL AKTIVITAS ADMINISTRASI</h3>
              <p className="text-white/40 text-[10px] uppercase font-mono tracking-wider mt-1">Sistem otomatis mencatat seluruh tindakan struktural atau perubahan data sensitif yang dilakukan admin.</p>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-none bg-[#050505]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A0A0A] text-white/40 font-mono uppercase text-[9px] tracking-widest border-b border-white/10">
                  <tr>
                    <th className="p-4 font-normal">Waktu Audit</th>
                    <th className="p-4 font-normal">Administrator</th>
                    <th className="p-4 font-normal">Jenis Tindakan</th>
                    <th className="p-4 font-normal">Entitas Target</th>
                    <th className="p-4 font-normal">ID Target</th>
                    <th className="p-4 font-normal text-right">Detail Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/5 text-zinc-300">
                      <td className="p-4 text-white/30">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                      <td className="p-4 text-white font-medium">{log.admin_nama}</td>
                      <td className="p-4 font-mono">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-none text-white/80 text-[10px] tracking-wider uppercase">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-4 text-white/60 font-mono uppercase">{log.target_type}</td>
                      <td className="p-4 text-white/40 font-mono text-[10px]">{log.target_id}</td>
                      <td className="p-4 text-right text-white/40 text-[10px] max-w-xs truncate">
                        {JSON.stringify(log.detail)}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-white/30 tracking-widest text-[10px] uppercase font-mono">BELUM ADA REKAMAN AKTIVITAS AUDIT LOG</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* 1. LEAD REASSIGNMENT DIALOG (When deactivating sales) */}
      {reassignModal.show && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-[#F5F5F5] selection:bg-white selection:text-black">
          <div className="bg-[#050505] border border-white/10 p-6 rounded-none max-w-md w-full">
            <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-2 uppercase tracking-widest">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Alihkan Antrean Lead Aktif
            </h3>
            <p className="text-white/40 text-xs leading-relaxed mb-6 font-mono uppercase tracking-wider">
              Akun sales dinonaktifkan. Ada <span className="text-white font-semibold">{reassignModal.pendingCount} leads</span> aktif. Silakan alihkan antrean ini ke representative lain:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Pilih Sales Pengganti</label>
                <select
                  required
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2 text-xs focus:outline-none focus:border-white transition-colors"
                  value={targetReassignId}
                  onChange={(e) => setTargetReassignId(e.target.value)}
                >
                  <option value="" className="bg-[#050505]">-- Pilih Sales Aktif --</option>
                  {users.filter(u => u.id !== reassignModal.fromUserId && u.status_akun === 'aktif' && u.role === 'sales').map(u => (
                    <option key={u.id} value={u.id} className="bg-[#050505]">{u.nama} ({u.referral_code})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => setReassignModal({ show: false, fromUserId: '', pendingCount: 0 })}
                  className="px-4 py-2 border border-white/10 text-white/40 text-[10px] uppercase font-mono tracking-widest rounded-none hover:text-white hover:border-white transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleExecuteReassign}
                  className="px-4 py-2 bg-white text-black font-mono font-semibold text-[10px] uppercase tracking-widest rounded-none hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  Reassign & Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. QUESTION ADD/EDIT DIALOG */}
      {questionModal.show && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-[#F5F5F5] selection:bg-white selection:text-black">
          <form onSubmit={handleSaveQuestion} className="bg-[#050505] border border-white/10 p-6 sm:p-8 rounded-none max-w-lg w-full text-xs space-y-4 overflow-y-auto max-h-[90vh]">
            <h3 className="text-sm font-medium uppercase tracking-widest text-white border-b border-white/10 pb-3">
              {questionModal.mode === 'add' ? 'Tambah Parameter Pertanyaan' : 'Edit Parameter Pertanyaan'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Teks Pertanyaan</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2.5 focus:outline-none focus:border-white transition-colors"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Tipe Scoring</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2 focus:outline-none focus:border-white transition-colors"
                    value={String(qIsScored)}
                    onChange={(e) => setQIsScored(e.target.value === 'true')}
                  >
                    <option value="true" className="bg-[#050505]">Dihitung Poin (Scored)</option>
                    <option value="false" className="bg-[#050505]">Prediksi Diri / Survei (Unscored)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Grup Scoring</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2 focus:outline-none focus:border-white transition-colors"
                    value={qGroup}
                    onChange={(e) => setQGroup(e.target.value)}
                  >
                    <option value="kategori_utama" className="bg-[#050505]">Utama (Financial Security)</option>
                    <option value="prediksi_diri" className="bg-[#050505]">Prediksi Mandiri</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Status Publikasi</label>
                <select
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2 focus:outline-none focus:border-white transition-colors"
                  value={qStatus}
                  onChange={(e) => setQStatus(e.target.value as any)}
                >
                  <option value="aktif" className="bg-[#050505]">Aktif (Tampil di Form)</option>
                  <option value="nonaktif" className="bg-[#050505]">Non-aktif (Draft)</option>
                </select>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-3">Pilihan Jawaban & Bobot Nilai</label>
                <div className="space-y-2">
                  {qOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex gap-2 items-center">
                      <span className="font-mono text-white/40 w-4">{oIdx+1}.</span>
                      <input
                        type="text"
                        required
                        placeholder="Label Opsi Jawaban"
                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-none px-3 py-2 focus:outline-none focus:border-white transition-colors"
                        value={opt.label_text}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[oIdx].label_text = e.target.value;
                          setQOptions(updated);
                        }}
                      />
                      <input
                        type="number"
                        required
                        placeholder="Poin"
                        className="w-16 bg-white/5 border border-white/10 text-white rounded-none px-2 py-2 text-center font-mono focus:outline-none focus:border-white transition-colors"
                        value={opt.skor_value}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[oIdx].skor_value = Number(e.target.value);
                          setQOptions(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setQuestionModal({ show: false, mode: 'add' })}
                className="px-4 py-2 border border-white/10 text-white/40 rounded-none hover:text-white hover:border-white transition-colors font-mono uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black font-mono font-semibold rounded-none hover:bg-zinc-200 transition-colors uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Simpan Parameter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. MODULE ADD/EDIT DIALOG */}
      {moduleModal.show && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-[#F5F5F5] selection:bg-white selection:text-black">
          <form onSubmit={handleSaveModule} className="bg-[#050505] border border-white/10 p-6 sm:p-8 rounded-none max-w-md w-full text-xs space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-widest text-white border-b border-white/10 pb-3">
              {moduleModal.mode === 'add' ? 'Tambah Video Modul Belajar' : 'Edit Video Modul Belajar'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Judul Video Pembelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Closing Strategy"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2.5 focus:outline-none focus:border-white transition-colors"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">YouTube Video Link (Unlisted/Public)</label>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2.5 focus:outline-none focus:border-white transition-colors font-mono"
                  value={mUrl}
                  onChange={(e) => setMUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Nomor Urut Tampilan</label>
                <input
                  type="number"
                  required
                  className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2.5 focus:outline-none focus:border-white transition-colors font-mono"
                  value={mOrder}
                  onChange={(e) => setMOrder(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModuleModal({ show: false, mode: 'add' })}
                className="px-4 py-2 border border-white/10 text-white/40 rounded-none hover:text-white hover:border-white transition-colors font-mono uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black font-mono font-semibold rounded-none hover:bg-zinc-200 transition-colors uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Simpan Modul
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. LEAD DETAILS SNAPSHOT DETAILED VIEW */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050505] border border-white/10 p-6 sm:p-8 rounded-none max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 text-[#F5F5F5] selection:bg-white selection:text-black">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Lead Dossier Spec (Admin Mode)</span>
                <h3 className="text-2xl font-light text-white uppercase tracking-wider">{selectedLead.nama_calon_nasabah}</h3>
                <p className="text-white/40 text-[10px] font-mono">Lead ID: {selectedLead.id} • WhatsApp: {selectedLead.whatsapp}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 border border-white/10 hover:border-white rounded-none text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white/5 p-4 rounded-none border border-white/10">
                <span className="text-white/40 font-mono text-[9px] block uppercase tracking-widest">FINANCIAL METRICS</span>
                <div className="space-y-2 mt-3 font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-white/40">Income:</span>
                    <span className="text-white">Rp {selectedLead.kondisi_finansial.income.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-white/40">Expenses:</span>
                    <span className="text-white">Rp {selectedLead.kondisi_finansial.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-white/40">Monthly Debt:</span>
                    <span className="text-white">Rp {selectedLead.kondisi_finansial.debt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Emergency Fund:</span>
                    <span className="text-white">Rp {selectedLead.kondisi_finansial.emergency_fund.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-none border border-white/10 space-y-3">
                <div>
                  <span className="text-white/40 font-mono text-[9px] block uppercase tracking-widest">DEMOGRAPHICS & SOCIAL</span>
                  <p className="mt-1 text-white font-medium">{selectedLead.pekerjaan} • {selectedLead.status_pernikahan} ({selectedLead.jumlah_tanggungan} Tanggungan)</p>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <span className="text-white/40 font-mono text-[9px] block uppercase tracking-widest">EXISTING PROTECTION</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedLead.proteksi_existing.length > 0 ? (
                      selectedLead.proteksi_existing.map((t, idx) => (
                        <span key={idx} className="bg-white/10 border border-white/10 text-[9px] px-2 py-0.5 rounded-none font-mono text-white/80 uppercase tracking-wider">{t}</span>
                      ))
                    ) : (
                      <span className="text-white/30 italic text-[10px] font-mono">No existing protection</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ANSWERS HISTORICAL SNAPSHOT */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-none space-y-3">
              <h4 className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Snapshot Jawaban Pengisian (Historis)</h4>
              <div className="space-y-3 text-xs">
                {(Object.values(selectedLead.jawaban_assessment) as any[]).map((ans: any, idx: number) => (
                  <div key={idx} className="border-b border-white/5 pb-2.5 last:border-b-0">
                    <span className="text-white/40 font-mono text-[9px] block">SOAL {idx + 1}: {ans.question}</span>
                    <p className="text-white font-medium mt-1">{ans.answer} <span className="text-white/40 font-mono text-[9px] ml-1">({ans.score} Poin)</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* SEGMENTATION AND RATINGS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-[#0A0A0A] border border-white/10 p-3.5 rounded-none">
                <span className="text-white/40 font-mono text-[9px] block uppercase tracking-widest">HEALTH INDEX SCORE</span>
                <span className="text-lg font-mono text-white mt-1 block">{selectedLead.skor_aktual} Pts</span>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 p-3.5 rounded-none">
                <span className="text-white/40 font-mono text-[9px] block uppercase tracking-widest">PREDICTED CATEGORY</span>
                <span className="text-lg font-mono text-zinc-200 mt-1 block">{selectedLead.kategori_hasil}</span>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 p-3.5 rounded-none">
                <span className="text-white/40 font-mono text-[9px] block uppercase tracking-widest">AWARENESS GAP</span>
                <span className="text-xs font-semibold text-white mt-1.5 block leading-tight uppercase tracking-wide">{selectedLead.gap_kesadaran}</span>
              </div>
            </div>

            {/* PDP Consent Verification Footnote */}
            <div className="bg-white/5 border border-white/10 text-[9px] p-3 rounded-none flex items-center justify-between font-mono text-white/40">
              <span>Consent Diberikan: {selectedLead.consent_diberikan ? 'Ya' : 'Tidak'}</span>
              <span>Timestamp: {new Date(selectedLead.consent_timestamp).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050505] border border-white/10 p-6 rounded-none max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-white font-mono text-xs uppercase font-bold tracking-wider">
              <AlertTriangle className="w-4 h-4 text-white/80" /> {confirmModal.title}
            </div>
            <p className="text-white/80 text-xs font-sans leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 border border-white/10 hover:border-white text-white/60 hover:text-white text-[10px] font-mono uppercase tracking-widest rounded-none transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, show: false }));
                  confirmModal.onConfirm();
                }}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-[10px] font-mono uppercase tracking-widest rounded-none transition-colors cursor-pointer font-bold"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Prompt Modal */}
      {promptModal.show && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050505] border border-white/10 p-6 rounded-none max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-white font-mono text-xs uppercase font-bold tracking-wider">
              <Edit2 className="w-4 h-4 text-white/80" /> {promptModal.title}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest">Masukkan Nilai</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 text-white rounded-none px-3 py-2 text-xs focus:outline-none focus:border-white transition-colors font-mono uppercase text-zinc-100"
                value={promptModal.value}
                onChange={(e) => setPromptModal(prev => ({ ...prev, value: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setPromptModal(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 border border-white/10 hover:border-white text-white/60 hover:text-white text-[10px] font-mono uppercase tracking-widest rounded-none transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const val = promptModal.value;
                  setPromptModal(prev => ({ ...prev, show: false }));
                  promptModal.onConfirm(val);
                }}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-[10px] font-mono uppercase tracking-widest rounded-none transition-colors cursor-pointer font-bold"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
