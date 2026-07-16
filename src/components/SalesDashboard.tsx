/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, Shield, ExternalLink, Calendar, Key, CheckSquare, 
  ChevronRight, RefreshCw, Eye, ThumbsUp, AlertCircle, Play, 
  Check, Lock, Copy, Send, Settings, User, Compass, HelpCircle, Printer,
  Clock
} from 'lucide-react';
import { User as UserType, Lead, Module } from '../types';


interface SalesDashboardProps {
  token: string;
  user: UserType;
  onLogout: () => void;
  onUpdateUser: (updated: UserType) => void;
}

export default function SalesDashboard({ token, user, onLogout, onUpdateUser }: SalesDashboardProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'crm' | 'modules' | 'calendar' | 'leaderboard' | 'settings'>('overview');

  // Dashboard Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);

  const [selectedDays, setSelectedDays] = useState<number[]>(user.schedule_availability?.days || [1, 2, 3, 4, 5]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(user.schedule_availability?.slots || ['09:00', '11:00', '13:00', '15:00', '17:00']);


  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Forms & Modals
  const [wKey, setWKey] = useState(user.web3forms_key || '');
  const [sName, setSName] = useState(user.nama || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [whatsappLink, setWhatsappLink] = useState(user.whatsapp_link || '');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeVideo, setActiveVideo] = useState<Module | null>(null);

  // Copy referral code notification
  const [copied, setCopied] = useState(false);

  // Reusable custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirmation = (options: {
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      onConfirm: () => {
        options.onConfirm();
        setConfirmModal(null);
      }
    });
  };

  // Fetch Dashboard State
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Leads & bookings
      const leadRes = await fetch('/api/sales/leads', { headers });
      const leadData = await leadRes.json();
      setLeads(leadData.leads || []);
      setBookings(leadData.bookings || []);

      // Modules
      const modRes = await fetch('/api/sales/modules', { headers });
      const modData = await modRes.json();
      setModules(modData.modules || []);
      setCompletedModuleIds(modData.completedIds || []);

      // Leaderboard
      const lRes = await fetch('/api/sales/leaderboard', { headers });
      const lData = await lRes.json();
      setLeaderboard(lData.leaderboard || []);

      // Global Settings (Discord link, text pitch, policy, headlines)
      const configRes = await fetch(`/api/assessment/config?ref=${user.referral_code || 'ADMIN'}`);
      if (configRes.ok) {
        const configData = await configRes.json();
        setSettings(configData.settings || {});
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-polling interval to keep leaderboard and pipelines updated instantly (every 10 seconds)
    const interval = setInterval(() => {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch leads and bookings in background (non-blocking)
      fetch('/api/sales/leads', { headers })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed');
        })
        .then(leadData => {
          if (leadData.leads) setLeads(leadData.leads);
          if (leadData.bookings) setBookings(leadData.bookings);
        })
        .catch(err => console.error('Error polling leads:', err));

      // Fetch leaderboard in background (non-blocking)
      fetch('/api/sales/leaderboard', { headers })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed');
        })
        .then(lData => {
          if (lData.leaderboard) setLeaderboard(lData.leaderboard);
        })
        .catch(err => console.error('Error polling leaderboard:', err));
    }, 10000);

    return () => clearInterval(interval);
  }, [activeTab, token]);

  // Actions
  const handleDeleteLead = (leadId: string) => {
    triggerConfirmation({
      title: 'HAPUS LEAD SECARA PERMANEN',
      message: 'Apakah Anda yakin ingin menghapus calon nasabah ini dari database Anda? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'YA, HAPUS PERMANEN',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/sales/leads/${leadId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            setLeads(leads.filter(l => l.id !== leadId));
            if (selectedLead && selectedLead.id === leadId) setSelectedLead(null);
          } else {
            alert('Gagal menghapus lead');
          }
        } catch (err) {
          console.error('Failed to delete lead:', err);
        }
      }
    });
  };

  const handleUpdateStatus = (leadId: string, nextStatus: Lead['status_crm']) => {
    const targetLead = leads.find(l => l.id === leadId);
    const leadName = targetLead ? targetLead.nama_calon_nasabah : 'calon nasabah';
    
    triggerConfirmation({
      title: 'PERBARUI STATUS PIPELINE',
      message: `Apakah Anda yakin ingin memindahkan status ${leadName} menjadi "${nextStatus.toUpperCase()}"?`,
      confirmText: 'YA, PINDAHKAN STATUS',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/sales/leads/update-status', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ leadId, status: nextStatus })
          });
          if (res.ok) {
            setLeads(leads.map(l => l.id === leadId ? { ...l, status_crm: nextStatus } : l));
            if (selectedLead && selectedLead.id === leadId) {
              setSelectedLead({ ...selectedLead, status_crm: nextStatus });
            }
          }
        } catch (err) {
          console.error('Failed to update CRM pipeline status:', err);
        }
      }
    });
  };

  const handleMarkNoShow = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    const lead = leads.find(l => l.id === (booking ? booking.lead_id : ''));
    const leadName = lead ? lead.nama_calon_nasabah : 'calon nasabah';

    triggerConfirmation({
      title: 'TANDAI SEBAGAI NO-SHOW',
      message: `Tandai pertemuan Zoom dengan ${leadName} sebagai No-Show (Tidak Datang)?`,
      confirmText: 'YA, NO-SHOW',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/sales/bookings/no-show', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bookingId })
          });
          if (res.ok) {
            fetchDashboardData();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleToggleModuleProgress = async (moduleId: string, completed: boolean) => {
    try {
      const res = await fetch('/api/sales/modules/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ moduleId, completed })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      if (completed) {
        setCompletedModuleIds([...completedModuleIds, moduleId]);
      } else {
        setCompletedModuleIds(completedModuleIds.filter(id => id !== moduleId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert('Password baru dan konfirmasi password tidak cocok!');
      return;
    }

    try {
      const payload: any = {
        nama: sName,
        web3forms_key: wKey,
        avatar_url: avatarUrl,
        whatsapp_link: whatsappLink,
        schedule_availability: {
          days: selectedDays,
          slots: selectedSlots
        }
      };
      if (newPassword) {
        payload.password = newPassword;
      }

      const res = await fetch('/api/sales/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        onUpdateUser(data.user);
        setNewPassword('');
        setConfirmPassword('');
        alert('Profil dan pengaturan berhasil diperbarui!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyRefLink = () => {
    if (user.status_akun === 'pending' || !user.referral_code) {
      alert('Tautan tidak dapat disalin karena akun Anda masih pending persetujuan Admin.');
      return;
    }
    const link = `${window.location.origin}/?ref=${user.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Right-click deterrent
  const handlePreventContext = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Samoia Security Notice: Security Watermarking is active. Full-screen recording or direct content source fetching is blocked.');
  };

  // Convert youtube video links into standard embed URLs
  const getEmbedUrl = (url: string) => {
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?modestbranding=1&rel=0&showinfo=0&controls=1`;
    }
    return url;
  };

  // Calculations for pipeline stats
  const totalLeads = leads.length;
  const closedLeads = leads.filter(l => l.status_crm === 'closed').length;
  const activeBookings = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <>
      <div className="space-y-6 no-print">

        {/* Pending Account Alert Banner */}
      {user.status_akun === 'pending' && (
        <div className="bg-amber-950/20 border border-amber-500/20 p-5 rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold tracking-wider">
              <AlertCircle className="w-4 h-4" /> Akun Anda Masih Pending (Menunggu Persetujuan Admin)
            </div>
            <p className="text-white/80 text-xs">
              Sistem memerlukan persetujuan Admin sebelum kode referral Anda diterbitkan. 
              <strong> Tanpa kode referral yang aktif, Anda belum memiliki tautan halaman assessment yang valid.</strong>
            </p>
{/* Hidden demo tip removed */}
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 border border-amber-500/30 hover:border-amber-400 text-amber-400 hover:bg-amber-500/10 text-[10px] font-mono uppercase tracking-widest rounded-none transition-colors whitespace-nowrap cursor-pointer"
          >
            Logout &amp; Login Admin
          </button>
        </div>
      )}
      
      {/* Sales Welcome Banner Card */}
      <div className="bg-[#0A0A0A] border border-white/10 p-6 sm:p-8 rounded-none relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono border uppercase tracking-wider ${
              user.status_sertifikasi === 'lulus' ? 'bg-white text-black border-white font-bold' : 'bg-red-950/20 text-red-400 border-red-500/20'
            }`}>
              AAJI / AASI: {user.status_sertifikasi === 'lulus' ? 'LULUS CERTIFIED' : 'BELUM SERTIFIKASI'}
            </span>
            <span className="text-white/40 font-mono text-[10px] tracking-wider">| Portal ID: {user.id}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-1">Advisor Identity</span>
            <h2 className="text-3xl font-light tracking-tight uppercase text-white">{user.nama}</h2>
          </div>
          <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Status Akun Anda: <span className="text-white font-semibold">{user.status_akun}</span></p>
        </div>

        {/* Dynamic Referral Link copy widget */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-none max-w-sm w-full md:w-auto">
          <span className="text-[9px] font-mono text-white/40 block uppercase mb-1.5 tracking-wider">UNIVERSAL ASSESSMENT LINK</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              className="bg-[#050505] border border-white/10 px-3 py-1.5 rounded-none text-xs text-[#F5F5F5] font-mono focus:outline-none w-56 truncate focus:border-white transition-colors"
              value={user.status_akun === 'pending' ? 'PENDING (TUNGGU PERSETUJUAN ADMIN)' : `${window.location.origin}/?ref=${user.referral_code}`}
            />
            <button
              onClick={copyRefLink}
              className="p-1.5 bg-white text-black font-medium rounded-none hover:bg-white/90 transition-all border border-white"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {user.status_akun !== 'pending' && (
              <a
                href={`${window.location.origin}/?ref=${user.referral_code}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-transparent text-white font-medium rounded-none hover:bg-white/10 transition-all border border-white/20 hover:border-white flex items-center justify-center"
                title="Buka Halaman Assessment"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <span className="text-[10px] text-white/40 mt-1.5 block leading-normal">Bagikan link ini ke calon nasabah untuk capture lead & hitung skor otomatis.</span>
        </div>
      </div>

      {/* --- DASHBOARD WIDGET NAVIGATION TABS --- */}
      <div className="flex border-b border-white/10 bg-white/5 overflow-x-auto scroller-hidden rounded-none">
        {[
          { key: 'overview', label: 'Ringkasan Kerja' },
          { key: 'crm', label: 'CRM Lead Pipeline' },
          { key: 'modules', label: 'Modul Pembelajaran' },
          { key: 'calendar', label: 'Jadwal Pertemuan' },
          { key: 'leaderboard', label: 'Papan Peringkat (Leaderboard)' },
          { key: 'settings', label: 'Token & Konfigurasi' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-4 text-[10px] font-mono uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap cursor-pointer rounded-none ${
              activeTab === tab.key 
                ? 'border-white text-white font-semibold bg-white/5' 
                : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- SUBVIEW RENDERERS --- */}

      {/* 1. TAB: OVERVIEW SUMMARY */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* STATS WIDGETS */}
          <div className="border border-white/10 bg-[#0A0A0A] p-6 rounded-none flex flex-col justify-between h-36">
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Total Leads Terkumpul</span>
            <span className="text-3xl font-light tracking-tight text-white uppercase">{totalLeads} Leads</span>
            <p className="text-white/40 text-[9px] font-mono">Daftar calon nasabah yang mengisi kuesioner Anda.</p>
          </div>

          <div className="border border-white/10 bg-[#0A0A0A] p-6 rounded-none flex flex-col justify-between h-36">
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Closing Keberhasilan</span>
            <span className="text-3xl font-light tracking-tight text-white uppercase">{closedLeads} Leads</span>
            <p className="text-white/40 text-[9px] font-mono">Leads yang berstatus "Closed" dalam CRM.</p>
          </div>

          <div className="border border-white/10 bg-[#0A0A0A] p-6 rounded-none flex flex-col justify-between h-36">
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Rasio Closing</span>
            <span className="text-3xl font-light tracking-tight text-white uppercase">
              {totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0}%
            </span>
            <p className="text-white/40 text-[9px] font-mono">Perbandingan leads yang masuk dibanding closing.</p>
          </div>

          {/* Discord CTA Widget */}
          <div className="md:col-span-3 border border-white/10 bg-white/5 p-6 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest">KOMUNITAS SALES</span>
              <h3 className="text-lg font-light text-white uppercase tracking-wider">Bergabung ke Samoia Consulting Discord Community</h3>
              <p className="text-white/60 text-xs leading-relaxed">Gantikan forum internal konvensional dengan Discord. Diskusikan closing strategy dan sharing leads insights.</p>
            </div>
            <a
              href={settings.discord_invite_link || "https://discord.gg/samoia-consulting"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-black font-semibold rounded-none text-[10px] uppercase tracking-widest hover:bg-white/90 transition-all cursor-pointer whitespace-nowrap"
            >
              Join Discord Hub <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Quick CRM Overview Preview */}
          <div className="md:col-span-2 border border-white/10 bg-[#0A0A0A] p-6 rounded-none space-y-4">
            <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Leads CRM Terbaru</h3>
            <div className="divide-y divide-white/5">
              {leads.slice(0, 5).map(l => (
                <div key={l.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-white">{l.nama_calon_nasabah}</h4>
                    <span className="text-white/40 text-[9px] font-mono uppercase tracking-wider">{l.pekerjaan} • {l.segmen_profesi}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white/60 font-medium">Rp {l.kondisi_finansial.income.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono border uppercase tracking-wider ${
                      l.status_crm === 'closed' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' :
                      l.status_crm === 'baru' ? 'bg-white text-black border-white' :
                      'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      {l.status_crm}
                    </span>
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <p className="text-white/40 font-mono text-center py-6">Belum ada leads masuk untuk referral Anda.</p>
              )}
            </div>
          </div>

          {/* Quick Leaderboard Standing Preview */}
          <div className="border border-white/10 bg-[#0A0A0A] p-6 rounded-none space-y-4">
            <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Papan Peringkat Sales</h3>
            <div className="space-y-3">
              {leaderboard.slice(0, 4).map((salesRep, idx) => (
                <div key={salesRep.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white/30 font-semibold">{idx+1}.</span>
                    <span className="text-white font-medium">{salesRep.nama}</span>
                  </div>
                  <span className="font-mono text-white/50">{salesRep.score} Pts</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 2. TAB: CRM PIPELINE WITH STAGE UPDATE */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium font-mono text-white/80 uppercase tracking-wider">PIPELINE CRM ADVOCACY</h3>
            <p className="text-white/40 text-xs mt-1">Ubah status sales pipeline calon nasabah untuk pelacakan efisiensi closing secara detail.</p>
          </div>

          <div className="overflow-x-auto border border-white/10 rounded-none bg-[#0A0A0A]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/40 font-mono uppercase text-[9px] tracking-widest border-b border-white/10">
                <tr>
                  <th className="p-4">Calon Nasabah</th>
                  <th className="p-4">WhatsApp</th>
                  <th className="p-4">Profesi / Segmen</th>
                  <th className="p-4">Kondisi Finansial</th>
                  <th className="p-4">Skor Aktual / Kategori</th>
                  <th className="p-4">Status Pipeline CRM</th>
                  <th className="p-4 text-right">Opsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {leads.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-semibold text-white">{l.nama_calon_nasabah}</td>
                    <td className="p-4 font-mono text-white/60">{l.whatsapp}</td>
                    <td className="p-4">
                      <span>{l.pekerjaan}</span>
                      <span className="block text-[9px] text-white/40 font-mono uppercase tracking-wider">{l.segmen_profesi}</span>
                    </td>
                    <td className="p-4 font-mono">
                      <span>Inc: Rp {l.kondisi_finansial.income.toLocaleString()}</span>
                      <span className="block text-[10px] text-white/40">Exp: Rp {l.kondisi_finansial.expenses.toLocaleString()}</span>
                    </td>
                    <td className="p-4 font-mono">
                      <span className="text-white font-medium">{l.skor_aktual} Pts</span>
                      <span className="block text-[10px] text-white/40">{l.kategori_hasil}</span>
                    </td>
                    <td className="p-4">
                      <select
                        className="bg-[#050505] border border-white/10 text-white rounded-none px-2.5 py-1 text-xs focus:outline-none focus:border-white font-mono transition-colors"
                        value={l.status_crm}
                        onChange={(e) => handleUpdateStatus(l.id, e.target.value as any)}
                      >
                        <option value="baru">BARU (UNCONTACTED)</option>
                        <option value="dihubungi">DIHUBUNGI (CONTACTED)</option>
                        <option value="qualified">QUALIFIED</option>
                        <option value="closed">CLOSED / CONTRACTED</option>
                        <option value="ghosting">GHOSTING</option>
                        <option value="lost">LOST / CANCELLED</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedLead(l)}
                          title="Lihat Detail (Dossier)"
                          className="p-1.5 border border-white/10 hover:border-white text-white/60 hover:text-white rounded-none transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(l.id)}
                          title="Hapus Lead"
                          className="p-1.5 border border-white/10 hover:border-red-500 text-white/60 hover:text-red-500 rounded-none transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-white/40 font-mono tracking-wider">BELUM ADA LEADS DITEMUKAN PADA AKUN REFERRAL ANDA</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TAB: LEARNING MODULES FOR SALES (GATED IF UNQUALIFIED) */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium font-mono text-white/80 uppercase tracking-wider">AKADEMI PENJUALAN SAMOIA CONSULTING</h3>
            <p className="text-white/40 text-xs mt-1">Daftar video eksklusif unlisted dari YouTube untuk membantu meningkatkan teknik penutupan asuransi Anda.</p>
          </div>

          {/* GATING OVERLAY WRAPPER */}
          {user.status_sertifikasi !== 'lulus' ? (
            <div className="border border-red-500/20 bg-red-950/10 p-8 rounded-none text-center space-y-4 max-w-2xl mx-auto">
              <Lock className="w-10 h-10 text-red-500 mx-auto" />
              <h4 className="text-lg font-light text-white uppercase tracking-wider">AKSES DIKUNCI — BELUM SERTIFIKASI</h4>
              <p className="text-white/60 text-xs leading-relaxed">
                Mohon maaf, modul pelatihan unlisted ini di-gate secara ketat. Anda harus lulus sertifikasi keagenan resmi AAJI/AASI terlebih dahulu. Hubungi administrator portal untuk memperbarui status sertifikasi Anda jika Anda sudah lulus.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* VIDEO PLAYER COMPONENT PANEL */}
              <div className="lg:col-span-2 border border-white/10 bg-[#0A0A0A] rounded-none overflow-hidden">
                {activeVideo ? (
                  <div className="space-y-4 p-4">
                    <span className="text-white/40 text-[9px] font-mono uppercase block tracking-widest">SAMOIA CONSULTING PLAYER • SECURITY ENFORCED</span>
                    
                    {/* Secure Video Container with right-click block & custom watermark */}
                    <div 
                      onContextMenu={handlePreventContext}
                      className="relative aspect-video bg-black border border-white/10 rounded-none overflow-hidden select-none"
                    >
                      <iframe
                        title="Samoia Video"
                        className="w-full h-full"
                        src={getEmbedUrl(activeVideo.youtube_url)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen={false} // Disable fullscreen security
                      ></iframe>

                      {/* Moving/overlapping security Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none">
                        <div className="text-center font-mono text-[10px] tracking-[0.25em] text-white uppercase select-none space-y-2">
                          <p>{user.nama}</p>
                          <p>{user.email}</p>
                          <p>CONFIDENTIAL ACADEMY PROPERTY</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <h4 className="text-sm font-semibold text-white uppercase tracking-wider">{activeVideo.judul}</h4>
                      
                      {/* Checkbox to mark complete */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/50 select-none hover:text-white">
                        <input
                          type="checkbox"
                          className="accent-white cursor-pointer"
                          checked={completedModuleIds.includes(activeVideo.id)}
                          onChange={(e) => handleToggleModuleProgress(activeVideo.id, e.target.checked)}
                        />
                        <span className="font-mono text-[10px] uppercase tracking-wider">Selesai Dipelajari</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center text-white/40 text-[10px] tracking-widest font-mono p-8 text-center bg-[#0A0A0A]">
                    <Play className="w-8 h-8 text-white/20 mb-3" />
                    PILIH MODUL DI SEBELAH KANAN UNTUK MEMUTAR VIDEO UTAMA
                  </div>
                )}
              </div>

              {/* LIST OF AVAILABLE VIDEOS */}
              <div className="border border-white/10 bg-[#0A0A0A] p-4 rounded-none space-y-3">
                <span className="text-[9px] font-mono text-white/40 uppercase block tracking-widest">DAFTAR MODUL</span>
                
                <div className="space-y-2">
                  {modules.map((m, idx) => {
                    const isCompleted = completedModuleIds.includes(m.id);
                    const isActive = activeVideo?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setActiveVideo(m)}
                        className={`w-full p-4 rounded-none border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${
                          isActive
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/60 border-white/10 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-full ${
                          isCompleted ? (isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-950/20 text-emerald-400') : (isActive ? 'bg-zinc-200 text-black' : 'bg-white/10')
                        }`}>
                          {isCompleted ? <Check className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`font-mono text-[9px] block uppercase ${isActive ? 'text-black/60' : 'text-white/40'}`}>MODUL {idx+1}</span>
                          <span className={`font-semibold block truncate mt-0.5 ${isActive ? 'text-black' : 'text-white'}`}>{m.judul}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* 4. TAB: CALENDAR SCHEDULES & MARK NO SHOW */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-medium font-mono text-white/80 uppercase tracking-wider">JADWAL PERTEMUAN ZOOM (CALENDAR BOOKINGS)</h3>
              <p className="text-white/40 text-xs mt-1">Kelola dan pantau jadwal pertemuan Zoom dengan calon nasabah Anda.</p>
            </div>
            

          </div>

          <div className="overflow-x-auto border border-white/10 rounded-none bg-[#0A0A0A]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/40 font-mono uppercase text-[9px] tracking-widest border-b border-white/10">
                <tr>
                  <th className="p-4">Tanggal & Waktu</th>
                  <th className="p-4">Calon Nasabah (Lead)</th>
                  <th className="p-4">Nomor WhatsApp</th>
                  <th className="p-4">Google Event Link</th>
                  <th className="p-4">Status Booking</th>
                  <th className="p-4 text-right">Penandaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {bookings.map(b => {
                  const lead = leads.find(l => l.id === b.lead_id);
                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-mono font-medium text-white">
                        {new Date(b.waktu_booking).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}{' '}
                        - Pukul {new Date(b.waktu_booking).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </td>
                      <td className="p-4 font-semibold text-white">{lead ? lead.nama_calon_nasabah : 'Unknown Lead'}</td>
                      <td className="p-4 font-mono text-white/60">{lead ? lead.whatsapp : 'Unknown'}</td>
                      <td className="p-4 text-white/40 font-mono text-[11px] truncate max-w-[150px]">{b.google_event_id}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono border uppercase tracking-wider ${
                          b.status === 'confirmed' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' :
                          b.status === 'no_show' ? 'bg-amber-950/20 text-amber-400 border-amber-500/20 animate-pulse' :
                          'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleMarkNoShow(b.id)}
                            className="px-2.5 py-1 border border-white/10 hover:border-red-500/30 hover:bg-red-950/10 text-white/60 hover:text-red-400 rounded-none text-[9px] uppercase font-mono tracking-wider transition-colors cursor-pointer"
                          >
                            Mark No-Show
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/40 font-mono tracking-wider">BELUM ADA JADWAL SESI BOOKING ZOOM UNTUK KUESIONER ANDA</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB: FULL STANDING LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-medium font-mono text-white/80 uppercase tracking-wider">PAPAN KINERJA & RANKING SALES REPRESENTATIVE</h3>
              <p className="text-white/40 text-xs mt-1">Diperbarui dinamis berdasarkan skor (10 poin per lead dihasilkan + 50 poin per closed deal).</p>
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="px-4 py-2 border border-white/10 hover:border-white text-white/60 hover:text-white rounded-none text-[9px] uppercase font-mono tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
          </div>

          <div className="overflow-x-auto border border-white/10 rounded-none bg-[#0A0A0A]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/40 font-mono uppercase text-[9px] tracking-widest border-b border-white/10">
                <tr>
                  <th className="p-4 w-20">Peringkat</th>
                  <th className="p-4">Nama Advisor</th>
                  <th className="p-4">Sertifikasi</th>
                  <th className="p-4">Leads Masuk</th>
                  <th className="p-4">Leads Closed</th>
                  <th className="p-4 text-right">Skor Kumulatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {leaderboard.map((salesRep, idx) => (
                  <tr key={salesRep.id} className={`hover:bg-white/[0.02] transition-colors ${salesRep.id === user.id ? 'bg-white/[0.03] font-semibold' : ''}`}>
                    <td className="p-4 font-mono font-bold text-white text-sm">
                      {idx === 0 ? '🏆 1' : idx + 1}
                    </td>
                    <td className="p-4 text-white">
                      {salesRep.nama} {salesRep.id === user.id && <span className="text-[9px] bg-white text-black font-semibold px-1.5 py-0.5 rounded-none ml-2 uppercase tracking-wider">Anda</span>}
                    </td>
                    <td className="p-4 font-mono">
                      <span className={`px-1.5 py-0.5 rounded-none border text-[9px] uppercase tracking-wider ${
                        salesRep.status_sertifikasi === 'lulus' ? 'bg-white text-black border-white font-bold' : 'bg-white/5 text-white/40 border-white/10'
                      }`}>
                        {salesRep.status_sertifikasi}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-white/60">{salesRep.leadsGenerated} Leads</td>
                    <td className="p-4 font-mono text-white">{salesRep.leadsClosed} Deals</td>
                    <td className="p-4 text-right font-mono text-white text-sm font-semibold">{salesRep.score} Pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB: SALES PROFILE & WEB3FORMS SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveProfile} className="space-y-8 max-w-2xl">
          <div>
            <h3 className="text-sm font-medium font-mono text-white/80 uppercase tracking-wider">PENGATURAN PORTAL ADVISOR</h3>
            <p className="text-white/40 text-xs mt-1">Konfigurasikan visual identitas profil, integrasi pihak ketiga, dan keamanan akses kredensial login Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* COLUMN 1: PROFILE IDENTITIES */}
            <div className="space-y-5">
              <div className="border border-white/10 bg-white/[0.01] p-5 space-y-4">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block border-b border-white/5 pb-2">Identitas Advisor</span>
                
                <div>
                  <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Nama Sales Representative</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-white transition-colors"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Custom WhatsApp Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: https://wa.me/628123456789"
                    className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 font-mono text-xs focus:outline-none focus:border-white transition-colors"
                    value={whatsappLink}
                    onChange={(e) => setWhatsappLink(e.target.value)}
                  />
                  <p className="text-white/30 text-[9px] mt-1.5 leading-relaxed">
                    Tautan langsung ke WhatsApp pribadi Anda agar calon nasabah dapat menghubungi Anda secara instan dari kuesioner.
                  </p>
                </div>
              </div>

              <div className="border border-white/10 bg-white/[0.01] p-5 space-y-4">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block border-b border-white/5 pb-2">Ganti Password Akses</span>
                
                <div>
                  <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Password Baru</label>
                  <input
                    type="password"
                    placeholder="Isi jika ingin mengganti password"
                    className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-white transition-colors"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    placeholder="Ketik ulang password baru"
                    className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-white transition-colors"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* COLUMN 2: VISUALS & INTEGRATIONS */}
            <div className="space-y-5">
              <div className="border border-white/10 bg-white/[0.01] p-5 space-y-4">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block border-b border-white/5 pb-2">Foto Profil / Avatar</span>
                
                <div>
                  <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">URL Foto Profil Kustom</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 font-mono text-xs focus:outline-none focus:border-white transition-colors"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-2 block">Atau Pilih Preset Abstract Emblem</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
                      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80',
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80'
                    ].map((preset, idx) => {
                      const isSelected = avatarUrl === preset;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(preset)}
                          className={`relative aspect-square border overflow-hidden rounded-none transition-all cursor-pointer ${
                            isSelected ? 'border-white scale-105 ring-1 ring-white' : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="border border-white/10 bg-white/[0.01] p-5 space-y-4">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block border-b border-white/5 pb-2">Jadwal Ketersediaan Zoom</span>
                <div>
                  <p className="text-[9px] text-white/40 leading-relaxed uppercase font-mono tracking-wider mb-4 mt-2">
                    Tentukan hari aktif dan slot jam konsultasi Zoom yang akan ditampilkan pada halaman kuesioner calon nasabah.
                  </p>

                  {/* Day Selection Toggles */}
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-2">Hari Aktif Konsultasi</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { val: 1, label: 'SEN' },
                        { val: 2, label: 'SEL' },
                        { val: 3, label: 'RAB' },
                        { val: 4, label: 'KAM' },
                        { val: 5, label: 'JUM' },
                        { val: 6, label: 'SAB' },
                        { val: 0, label: 'MIN' }
                      ].map((day) => {
                        const isActive = selectedDays.includes(day.val);
                        return (
                          <button
                            key={day.val}
                            type="button"
                            onClick={() => {
                              if (isActive) {
                                setSelectedDays(selectedDays.filter(d => d !== day.val));
                              } else {
                                setSelectedDays([...selectedDays, day.val]);
                              }
                            }}
                            className={`px-2.5 py-1 text-[9px] font-mono border transition-all cursor-pointer rounded-none ${
                              isActive 
                                ? 'bg-white text-black border-white' 
                                : 'bg-[#050505] text-white/40 border-white/10 hover:border-white/30'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slot Selection Toggles */}
                  <div>
                    <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-2">Slot Jam Kerja Tersedia (WIB)</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
                      ].map((slot) => {
                        const isActive = selectedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              if (isActive) {
                                setSelectedSlots(selectedSlots.filter(s => s !== slot));
                              } else {
                                setSelectedSlots([...selectedSlots, slot].sort());
                              }
                            }}
                            className={`py-1 text-[8px] font-mono border transition-all cursor-pointer rounded-none text-center ${
                              isActive 
                                ? 'bg-white text-black border-white' 
                                : 'bg-[#050505] text-white/40 border-white/10 hover:border-white/30'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-white/10 bg-white/[0.01] p-5 space-y-4">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block border-b border-white/5 pb-2">Integrasi Aplikasi Terhubung</span>
                <div>
                  <label className="block text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3 h-3 text-white/40" /> Token Web3Forms (Notifikasi Email Instan)
                  </label>
                  <input
                    type="text"
                    placeholder="Dapatkan token gratis di web3forms.com"
                    className="w-full bg-[#050505] border border-white/10 text-white rounded-none px-3.5 py-2 font-mono text-xs focus:outline-none focus:border-white transition-colors"
                    value={wKey}
                    onChange={(e) => setWKey(e.target.value)}
                  />
                  <p className="text-white/30 text-[9px] mt-1.5 leading-relaxed uppercase font-mono tracking-wider">
                    *Gunakan Web3Forms Key jika Anda ingin salinan data kuesioner terkirim otomatis ke email pribadi Anda.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-white text-black font-semibold rounded-none text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all cursor-pointer"
          >
            Simpan Perubahan Profile
          </button>
        </form>
      )}

      {/* --- DETAILED LEAD SPECIFICATION DRAWER MODAL --- */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050505] border border-white/10 p-6 sm:p-8 rounded-none max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 text-[#F5F5F5] selection:bg-white selection:text-black">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Lead Dossier Spec</span>
                <h3 className="text-2xl font-light text-white uppercase tracking-wider">{selectedLead.nama_calon_nasabah}</h3>
                <p className="text-white/40 text-[10px] font-mono">Lead ID: {selectedLead.id} • WhatsApp: {selectedLead.whatsapp}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 border border-white/10 hover:border-white rounded-none text-white/60 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-[9px] uppercase font-mono tracking-widest"
                >
                  <Printer className="w-3.5 h-3.5" /> Save PDF
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 border border-white/10 hover:border-white rounded-none text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </button>
              </div>
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

    </div>
    {/* Hidden print styling removed as dom-to-image is used. */}
    
    {/* Custom Premium Confirmation Dialog Modal */}
    {confirmModal && confirmModal.isOpen && (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#0A0A0A] border border-white/10 max-w-sm w-full p-6 text-center space-y-6 relative rounded-none">
          {/* Top accent strip */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white"></div>
          
          <div className="space-y-2">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] block">KONFIRMASI ADVISOR</span>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white">{confirmModal.title}</h3>
            <p className="text-white/50 text-[10px] leading-relaxed font-sans uppercase tracking-wider">{confirmModal.message}</p>
          </div>

          <div className="flex gap-2 font-mono">
            <button
              onClick={() => setConfirmModal(null)}
              className="flex-1 py-2 border border-white/10 hover:border-white text-white/60 hover:text-white rounded-none text-[9px] uppercase tracking-widest transition-colors cursor-pointer"
            >
              BATAL
            </button>
            <button
              onClick={confirmModal.onConfirm}
              className="flex-1 py-2 bg-white hover:bg-zinc-200 text-black font-semibold rounded-none text-[9px] uppercase tracking-widest transition-colors cursor-pointer"
            >
              {confirmModal.confirmText || 'KONFIRMASI'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
