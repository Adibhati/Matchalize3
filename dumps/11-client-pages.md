# Chunk 11 — Client Pages

> Matchalize · `client-pages` · files 11 of 27 chunks · 1 file(s) · 60 KB · ~17,514 tokens
> Generated 2026-10-17 21:10.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/pages/Admin.jsx`

---
### ./client/src/pages/Admin.jsx

```
import React, { useState, useEffect } from 'react';
import neu from '../styles/neu';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, AlertTriangle, Users, BarChart3, Settings,
  Search, ChevronLeft, ChevronRight, RefreshCw,
  Ban, EyeOff, X, Clock, GraduationCap, Plus, Send, Trash2
} from 'lucide-react';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const T = neu;

const ADMIN_CSS = `
  .adm-slam { transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .adm-slam:active:not(:disabled) { transform: translate(3px, 3px) !important; box-shadow: 0 0 0 #191919 !important; }
  @media (hover: hover) and (pointer: fine) {
    .adm-slam:hover:not(:active):not(:disabled) { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 #191919; }
  }
  .adm-slam:disabled { opacity: .4; cursor: not-allowed; transform: none !important; box-shadow: 3px 3px 0 #191919 !important; }

  .adm-card:focus-visible, .adm-slam:focus-visible, .adm-input:focus-visible {
    outline: 3px solid #FFD43D; outline-offset: 2px; }

  input:focus, textarea:focus, select:focus { box-shadow: 3px 3px 0 #191919; }

  @media (prefers-reduced-motion: reduce) {
    .adm-slam { transition: none; }
  }
`;

const label = { fontFamily: T.fontMono, fontSize: 9.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: T.ink3 };

const API = '/api/admin';
const TABS = ['overview', 'reports', 'users', 'colleges', 'analytics', 'settings'];

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (res.status === 401 || res.status === 403) {
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const msg = payload?.message || text || 'Request failed';
    throw new Error(msg);
  }

  return payload ?? {};
}

function Card({ children, style = {}, ...props }) {
  return (
    <div style={{
      backgroundColor: T.card,
      border: `2px solid ${T.ink}`,
      borderRadius: 16,
      boxShadow: `5px 5px 0 ${T.ink}`,
      ...style,
    }} {...props}>
      {children}
    </div>
  );
}

function Badge({ children, color = T.ink3, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: 999,
      color: color === T.yellow || color === T.green || color === T.coral ? T.ink : color,
      border: `1.5px solid ${color}`,
      backgroundColor: color === T.ink3 ? T.hair : 'transparent',
      fontFamily: T.fontMono,
      ...style,
    }}>{children}</span>
  );
}

function Skeleton({ style = {} }) {
  return <div style={{ backgroundColor: T.hair, borderRadius: 6, ...style }} />;
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        fontFamily: T.fontHeavy, fontSize: 22, fontWeight: 400, color: T.ink, margin: 0,
        letterSpacing: '-.01em', textTransform: 'uppercase',
        textShadow: `2px 2px 0 ${T.yellow}, 4px 4px 0 ${T.ink}`,
      }}>{title}</h2>
      {subtitle && <p style={{ ...label, marginTop: 8, color: T.ink2 }}>{subtitle}</p>}
    </div>
  );
}

const pillBtn = (variant = 'quiet') => ({
  background: variant === 'danger' ? T.red : variant === 'active' ? T.yellow : T.card,
  border: `2px solid ${T.ink}`,
  borderRadius: 11,
  boxShadow: `3px 3px 0 ${T.ink}`,
  padding: '8px 15px',
  cursor: 'pointer',
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: variant === 'danger' ? '#fff' : variant === 'active' ? T.ink : T.ink2,
  fontFamily: T.fontMono,
  transition: 'transform .08s steps(2), box-shadow .08s steps(2)',
});

function Pagination({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
      <button className="adm-slam" onClick={() => onPage(page - 1)} disabled={page <= 1}
        style={{ ...pillBtn(), width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
        <ChevronLeft size={16} strokeWidth={2.6} />
      </button>
      <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, color: T.ink2, fontVariantNumeric: 'tabular-nums' }}>{page} / {totalPages}</span>
      <button className="adm-slam" onClick={() => onPage(page + 1)} disabled={page >= totalPages}
        style={{ ...pillBtn(), width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
        <ChevronRight size={16} strokeWidth={2.6} />
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: T.yellow,
    reviewed: T.ink,
    actioned: T.red,
    dismissed: T.ink3,
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{
      fontFamily: T.fontMono,
      fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
      padding: '3px 10px', borderRadius: 999,
      border: `1.5px solid ${c}`,
      color: c,
      backgroundColor: c === T.yellow ? t.paper : 'transparent',
    }}>{status}</span>
  );
}

/* ─── OVERVIEW TAB ─── */
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await apiFetch('/stats');
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const cards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={18} strokeWidth={2.4} />, bg: T.coral, dark: false },
    { label: 'New Today', value: stats.newToday, icon: <Users size={18} strokeWidth={2.4} />, bg: T.yellow, dark: false },
    { label: 'Active (7d)', value: stats.active7d, icon: <LayoutDashboard size={18} strokeWidth={2.4} />, bg: T.green, dark: false },
    { label: 'Active (30d)', value: stats.active30d, icon: <Clock size={18} strokeWidth={2.4} />, bg: T.card, dark: true },
    { label: 'Pending Reports', value: stats.pendingReports, icon: <AlertTriangle size={18} strokeWidth={2.4} />, bg: T.red, dark: true },
    { label: 'Active Bans', value: stats.activeBans, icon: <Ban size={18} strokeWidth={2.4} />, bg: T.ink, dark: false },
    { label: 'Shadowbans', value: stats.activeShadowbans, icon: <EyeOff size={18} strokeWidth={2.4} />, bg: T.hair, dark: false },
  ] : [];

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <Skeleton style={{ height: 10, width: 100, marginBottom: 14 }} />
            <Skeleton style={{ height: 30, width: 80 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, fontWeight: 500, color: T.ink2, margin: 0 }}>Failed to load stats. Check your connection and admin access.</p></Card>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader title="Overview" subtitle="Platform health at a glance" />
        <button onClick={loadStats} className="adm-slam" style={{ ...pillBtn(), display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2.6} /> Refresh
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <Card style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={label}>{c.label}</span>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  border: `2px solid ${T.ink}`,
                  backgroundColor: c.bg,
                  color: c.dark ? '#fff' : T.ink,
                  boxShadow: `2.5px 2.5px 0 ${T.ink}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{c.icon}</div>
              </div>
              <p style={{ fontFamily: T.fontHeavy, fontSize: 27, fontWeight: 400, color: T.ink, margin: 0, letterSpacing: '-.01em', fontVariantNumeric: 'tabular-nums' }}>
                {(c.value ?? 0).toLocaleString()}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── REPORTS TAB ─── */
function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detailReport, setDetailReport] = useState(null);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, perPage: 15 });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const json = await apiFetch(`/reports?${params}`);
      setReports(json.data || []);
      setPagination(json.pagination);
    } catch (e) {
      console.error('Failed to load reports:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateReport = async (id, body) => {
    try {
      await apiFetch(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      load(pagination.page);
      setDetailReport(null);
    } catch (e) {
      alert('Failed to update report: ' + e.message);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle={`${pagination.total} total reports`} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} strokeWidth={2.4} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.ink3 }} />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px 11px 38px', borderRadius: 11, border: `2px solid ${T.ink}`, backgroundColor: T.card, fontSize: 13.5, fontWeight: 500, color: T.ink, outline: 'none', fontFamily: T.fontBody }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 11, border: `2px solid ${T.ink}`, backgroundColor: T.card, fontSize: 12, fontWeight: 700, color: T.ink, cursor: 'pointer', fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="actioned">Actioned</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} style={{ padding: 16 }}>
              <Skeleton style={{ height: 14, width: '60%', marginBottom: 10 }} />
              <Skeleton style={{ height: 12, width: '40%' }} />
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, fontWeight: 500, color: T.ink2, margin: 0 }}>No reports found</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {reports.map(r => (
            <Card key={r._id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: T.hair, border: `2px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {r.reported.photo ? <img src={r.reported.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Users size={16} strokeWidth={2.4} style={{ color: T.ink3 }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{r.reported.name}</span>
                      <StatusBadge status={r.status} />
                      <Badge color={T.ink}>{r.reportCount} reports</Badge>
                    </div>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: T.ink2, margin: '4px 0 0' }}>{r.reason} — by {r.reporter.name}</p>
                    <p style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.ink3, margin: '3px 0 0', fontVariantNumeric: 'tabular-nums' }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="adm-slam" onClick={() => setDetailReport(r)} style={pillBtn()}>View</button>
                  {r.status === 'pending' && <>
                    <button className="adm-slam" onClick={() => updateReport(r._id, { status: 'dismissed' })} style={pillBtn()}>Dismiss</button>
                    <button className="adm-slam" onClick={() => updateReport(r._id, { status: 'actioned' })} style={pillBtn('danger')}>Action</button>
                  </>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={p => load(p)} />

      <AnimatePresence>
        {detailReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={() => setDetailReport(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12,12,14,0.62)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ background: T.paper, borderRadius: 20, border: `2px solid ${T.ink}`, boxShadow: `8px 8px 0 ${T.ink}`, maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: 24, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: T.fontHeavy, fontSize: 18, fontWeight: 400, color: T.ink, margin: 0, letterSpacing: '-.01em', textTransform: 'uppercase' }}>Report Detail</h3>
                <button className="adm-slam" onClick={() => setDetailReport(null)} aria-label="Close" style={{ backgroundColor: T.card, border: `2px solid ${T.ink}`, borderRadius: 11, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink, boxShadow: `3px 3px 0 ${T.ink}`, flexShrink: 0 }}><X size={16} strokeWidth={2.8} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ backgroundColor: T.paper, borderRadius: 11, border: `2px solid ${T.ink}`, padding: 12 }}>
                  <p style={label}>Reporter</p>
                  <p style={{ fontWeight: 700, fontSize: 14, color: T.ink, margin: '6px 0 0' }}>{detailReport.reporter.name}</p>
                  <p style={{ fontFamily: T.fontMono, fontSize: 10.5, color: T.ink3, margin: '3px 0 0', wordBreak: 'break-word' }}>{detailReport.reporter.email}</p>
                </div>
                <div style={{ backgroundColor: T.paper, borderRadius: 11, border: `2px solid ${T.ink}`, padding: 12 }}>
                  <p style={label}>Reported</p>
                  <p style={{ fontWeight: 700, fontSize: 14, color: T.ink, margin: '6px 0 0' }}>{detailReport.reported.name}</p>
                  <p style={{ fontFamily: T.fontMono, fontSize: 10.5, color: T.ink3, margin: '3px 0 0', wordBreak: 'break-word' }}>{detailReport.reported.email}</p>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...label, marginBottom: 8 }}>Reason</p>
                <Badge color={T.ink}>{detailReport.reason}</Badge>
              </div>
              {detailReport.details && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ ...label, marginBottom: 8 }}>Details</p>
                  <p style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 500, color: T.ink, backgroundColor: T.paper, padding: 12, borderRadius: 11, border: `2px solid ${T.ink}`, lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>{detailReport.details}</p>
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <p style={{ ...label, marginBottom: 8 }}>Total Reports Against This User</p>
                <p style={{ fontFamily: T.fontHeavy, fontSize: 26, fontWeight: 400, color: T.red, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{detailReport.reportCount}</p>
              </div>
              {detailReport.status === 'pending' && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="adm-slam" onClick={() => updateReport(detailReport._id, { status: 'dismissed' })} style={{ ...pillBtn(), flex: 1 }}>Dismiss</button>
                  <button className="adm-slam" onClick={() => updateReport(detailReport._id, { status: 'actioned' })} style={{ ...pillBtn('danger'), flex: 1 }}>Action</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── USERS TAB ─── */
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detailUser, setDetailUser] = useState(null);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, perPage: 15 });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const json = await apiFetch(`/users?${params}`);
      setUsers(json.data || []);
      setPagination(json.pagination);
    } catch (e) {
      console.error('Failed to load users:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateUser = async (id, body) => {
    try {
      await apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      load(pagination.page);
      setDetailUser(null);
    } catch (e) {
      alert('Failed to update user: ' + e.message);
    }
  };

  const userStatus = (u) => {
    if (u.suspended) return 'Suspended';
    if (u.shadowbannedAt) return 'Shadowbanned';
    return 'Active';
  };

  const statusColor = (s) => {
    if (s === 'Suspended') return T.red;
    if (s === 'Shadowbanned') return T.coral;
    return T.green;
  };

  return (
    <div>
      <PageHeader title="Users" subtitle={`${pagination.total} total users`} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} strokeWidth={2.4} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.ink3 }} />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px 11px 38px', borderRadius: 11, border: `2px solid ${T.ink}`, backgroundColor: T.card, fontSize: 13.5, fontWeight: 500, color: T.ink, outline: 'none', fontFamily: T.fontBody }} />
        </div>
        {['all', 'active', 'shadowbanned', 'suspended'].map(s => (
          <button key={s} className="adm-slam" onClick={() => setStatusFilter(s)}
            style={{ ...pillBtn(statusFilter === s ? 'active' : 'quiet'), textTransform: 'capitalize', letterSpacing: '.04em', fontFamily: T.fontBody, fontSize: 12, fontWeight: 600 }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>{Array.from({ length: 5 }).map((_, i) => <Card key={i} style={{ padding: 16 }}><Skeleton style={{ height: 14, width: '50%', marginBottom: 10 }} /><Skeleton style={{ height: 12, width: '30%' }} /></Card>)}</div>
      ) : users.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, fontWeight: 500, color: T.ink2, margin: 0 }}>No users found</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {users.map(u => {
            const status = userStatus(u);
            return (
              <Card key={u._id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: T.hair, border: `2px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {u.photos?.[0] ? <img src={u.photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ fontWeight: 700, color: T.ink3, fontSize: 16 }}>{u.name?.[0]}</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{u.name}</span>
                        <Badge color={statusColor(status)}>{status}</Badge>
                      </div>
                      <p style={{ fontSize: 12.5, fontWeight: 500, color: T.ink2, margin: '3px 0 0' }}>{u.email} · {u.branch} · {u.year}</p>
                      <p style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.ink3, margin: '3px 0 0', fontVariantNumeric: 'tabular-nums' }}>Reports: {u.reportStats?.count || 0} · Last active: {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Never'}</p>
                    </div>
                  </div>
                  <button className="adm-slam" onClick={() => setDetailUser(u)} style={{ ...pillBtn(), flexShrink: 0 }}>Manage</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={p => load(p)} />

      <AnimatePresence>
        {detailUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            onClick={() => setDetailUser(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12,12,14,0.62)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ background: T.paper, borderRadius: 20, border: `2px solid ${T.ink}`, boxShadow: `8px 8px 0 ${T.ink}`, maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: 24, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: T.fontHeavy, fontSize: 19, fontWeight: 400, color: T.ink, margin: 0, letterSpacing: '-.01em', textTransform: 'uppercase' }}>{detailUser.name}</h3>
                <button className="adm-slam" onClick={() => setDetailUser(null)} aria-label="Close" style={{ backgroundColor: T.card, border: `2px solid ${T.ink}`, borderRadius: 11, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink, boxShadow: `3px 3px 0 ${T.ink}`, flexShrink: 0 }}><X size={16} strokeWidth={2.8} /></button>
              </div>
              <div style={{ backgroundColor: T.paper, borderRadius: 12, border: `2px solid ${T.ink}`, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Email', detailUser.email],
                  // Branch was removed from the schema, so including it rendered a literal
// "undefined" for every user. year alone is what's stored.
['College', [detailUser.college, detailUser.year].filter(Boolean).join(' · ') || '—'],
                  ['Joined', new Date(detailUser.createdAt).toLocaleDateString()],
                  ['Last Active', detailUser.lastActive ? new Date(detailUser.lastActive).toLocaleString() : 'Never'],
                  ['Reports', `${detailUser.reportStats?.count || 0} total, ${detailUser.reportStats?.pendingCount || 0} pending`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span style={label}>{k}</span>
                    <p style={{ fontFamily: T.fontBody, fontSize: 13.5, fontWeight: 600, color: T.ink, margin: '3px 0 0', wordBreak: 'break-word' }}>{v}</p>
                  </div>
                ))}
                {detailUser.suspendedReason && (
                  <div>
                    <span style={{ ...label, color: T.red }}>Suspension Reason</span>
                    <p style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: T.red, margin: '3px 0 0' }}>{detailUser.suspendedReason}</p>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...label, marginBottom: 8 }}>Admin Notes</p>
                <textarea value={detailUser.adminNotes || ''} onChange={e => setDetailUser({ ...detailUser, adminNotes: e.target.value })}
                  placeholder="Internal notes..."
                  style={{ width: '100%', boxSizing: 'border-box', minHeight: 60, padding: 12, borderRadius: 11, border: `2px solid ${T.ink}`, backgroundColor: T.card, fontSize: 13, fontWeight: 500, color: T.ink, resize: 'vertical', fontFamily: T.fontBody, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button className="adm-slam" onClick={() => updateUser(detailUser._id, { suspended: !detailUser.suspended, suspendedReason: !detailUser.suspended ? 'Admin action' : '' })}
                  style={{ ...pillBtn(detailUser.suspended ? 'quiet' : 'danger'), padding: '12px 8px' }}>
                  {detailUser.suspended ? 'Unsuspend' : 'Suspend'}
                </button>
                <button className="adm-slam" onClick={() => updateUser(detailUser._id, { shadowbanned: !detailUser.shadowbannedAt })}
                  style={{ ...pillBtn('quiet'), padding: '12px 8px', color: detailUser.shadowbannedAt ? T.ink2 : T.red }}>
                  {detailUser.shadowbannedAt ? 'Unshadowban' : 'Shadowban'}
                </button>
                <button className="adm-slam" onClick={() => updateUser(detailUser._id, { adminNotes: detailUser.adminNotes })}
                  style={{ ...pillBtn('quiet'), padding: '12px 8px' }}>
                  Save Notes
                </button>
                <button className="adm-slam" onClick={async () => { try { await apiFetch(`/users/${detailUser._id}/disconnect`, { method: 'POST' }); alert('Disconnect signal sent'); } catch (e) { alert('Failed: ' + e.message); } }}
                  style={{ ...pillBtn('quiet'), padding: '12px 8px', color: T.red }}>
                  Kick
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── ANALYTICS TAB ─── */
function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/analytics').then(d => { setData(d); setLoading(false); }).catch(e => { console.error('Failed to load analytics:', e.message); setLoading(false); });
  }, []);

  const Chart = ({ title, items, color }) => {
    const max = Math.max(...items.map(i => i.count), 1);
    return (
      <Card style={{ padding: 20 }}>
        <h4 style={{ ...label, marginBottom: 16 }}>{title}</h4>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
          {items.slice(-14).map((item, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: '100%', backgroundColor: color, borderRadius: '3px 3px 0 0', height: `${(item.count / max) * 100}%`, minHeight: 2, transition: 'height 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }} />
              <span style={{ fontFamily: T.fontMono, fontSize: 8, fontWeight: 700, color: T.ink3, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{item.date?.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  if (loading) return <div style={{ display: 'grid', gap: 16 }}>{Array.from({ length: 4 }).map((_, i) => <Card key={i} style={{ padding: 20, height: 180 }}><Skeleton style={{ height: '100%', width: '100%' }} /></Card>)}</div>;
  if (!data) return <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, fontWeight: 500, color: T.ink2, margin: 0 }}>Failed to load analytics</p></Card>;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Last 30 days" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Chart title="Daily Signups" items={data.dailySignups} color={T.green} />
        <Chart title="Active Users" items={data.dailyActive} color={T.coral} />
        <Chart title="Reports" items={data.dailyReports} color={T.red} />
        <Chart title="Matches" items={data.dailyMatches} color={T.yellow} />
        <Chart title="Messages" items={data.dailyMessages} color={T.ink} />
      </div>
    </div>
  );
}

/* ─── SETTINGS TAB ─── */
function SettingsTab() {
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/settings').then(d => { setSettings(d); setOriginal(d); setLoading(false); }).catch(e => { console.error('Failed to load settings:', e.message); setLoading(false); });
  }, []);

  const save = async () => {
    try {
      await apiFetch('/settings', { method: 'PUT', body: JSON.stringify(settings) });
      setOriginal({ ...settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('Failed to save settings: ' + e.message);
    }
  };

  const set = (key, val) => { setSettings(s => ({ ...s, [key]: val })); setSaved(false); };

  const fields = [
    { group: 'General', items: [
      { key: 'supportEmail', label: 'Support Email', type: 'text' },
      { key: 'maintenanceMode', label: 'Maintenance Mode', type: 'bool' },
    ]},
    { group: 'Moderation', items: [
      { key: 'shadowbanThreshold', label: 'Shadowban Score Threshold', type: 'number' },
      { key: 'autoShadowban', label: 'Auto-Shadowban', type: 'bool' },
    ]},
  ];

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original);

  if (loading) return <div>{Array.from({ length: 3 }).map((_, i) => <Card key={i} style={{ padding: 20, marginBottom: 12 }}><Skeleton style={{ height: 12, width: 200, marginBottom: 14 }} /><Skeleton style={{ height: 40 }} /></Card>)}</div>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform configuration" />
      {fields.map(group => (
        <Card key={group.group} style={{ padding: 20, marginBottom: 16 }}>
          <h4 style={{ fontFamily: T.fontHeavy, fontSize: 14, fontWeight: 400, color: T.ink, margin: '0 0 16px', letterSpacing: '.02em', textTransform: 'uppercase' }}>{group.group}</h4>
          {group.items.map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={label}>{f.label}</label>
              {f.type === 'bool'
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <button onClick={() => set(f.key, !settings[f.key])} style={{ width: 46, height: 26, borderRadius: 999, border: `2px solid ${T.ink}`, backgroundColor: settings[f.key] ? T.yellow : T.hair, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: settings[f.key] ? T.ink : T.card, border: `2px solid ${T.ink}`, boxSizing: 'border-box', position: 'absolute', top: 2, left: settings[f.key] ? 22 : 2, transition: 'left 0.2s cubic-bezier(0.22, 1, 0.36, 1)' }} />
                    </button>
                    <span style={{ fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700, color: T.ink2, textTransform: 'uppercase', letterSpacing: '.08em' }}>{settings[f.key] ? 'Enabled' : 'Disabled'}</span>
                  </div>
                : <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={settings[f.key] ?? ''}
                    onChange={e => set(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    style={{ width: '100%', maxWidth: 300, padding: '10px 13px', borderRadius: 11, border: `2px solid ${T.ink}`, backgroundColor: T.card, fontSize: 13.5, fontWeight: 500, color: T.ink, fontFamily: T.fontBody, outline: 'none', marginTop: 8 }}
                  />
              }
            </div>
          ))}
        </Card>
      ))}
      <button className="adm-slam" onClick={save} disabled={!hasChanges}
        style={{ ...pillBtn('danger'), padding: '13px 28px', fontSize: 11, opacity: hasChanges ? 1 : 0.4, cursor: hasChanges ? 'pointer' : 'not-allowed', backgroundColor: hasChanges ? T.red : T.card, color: hasChanges ? '#fff' : T.ink3 }}>
        {saved ? 'Saved' : 'Save Settings'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COLLEGES TAB — add a campus without touching code, and work the queue of
   students who asked for one.

   Two ideas drive the layout:
   1. Student counts sit next to every college, because editing a domain with
      400 people behind it is very different from editing one with zero.
   2. Requests are sorted by count descending. For a solo operator that ordering
      IS the priority list — it answers "which campus should I add next?"
   ═══════════════════════════════════════════════════════════════════════ */
const EMPTY_COLLEGE = { code: '', name: '', domains: [''], city: '', state: '', country: '', lat: '', lng: '' };

function CollegesTab() {
  const [colleges, setColleges] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY_COLLEGE);
  const [editing, setEditing] = useState(null);
  const [showOld, setShowOld] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      const [c, r] = await Promise.all([apiFetch('/colleges'), apiFetch('/college-requests')]);
      setColleges(c.colleges || []);
      setRequests(r.groups || []);
    } catch (e) { setMsg({ tone: 'bad', text: e.message }); }
  };
  useEffect(() => { load(); }, []);

  const flash = (tone, text) => { setMsg({ tone, text }); setTimeout(() => setMsg(null), 4000); };

  const setDomainAt = (i, v) => setForm((f) => {
    const d = [...f.domains];
    d[i] = v;
    return { ...f, domains: d };
  });

  const submitCollege = async (e) => {
    e.preventDefault();
    setBusy('save');
    try {
      const domains = form.domains.map((d) => d.trim()).filter(Boolean);
      const body = { code: form.code.trim().toLowerCase(), name: form.name.trim(), domains, city: form.city.trim(), state: form.state.trim(), country: form.country.trim() };
      /* 📍 Send latLng ONLY when both boxes are filled. Sending one alone, or
         sending `""`, would make the server's "present but malformed" branch
         fire and reject an otherwise-valid save — an operator adding a city
         should not have to think about coordinates at all. Both blank means
         "no position", which is a legitimate state. */
      const lat = String(form.lat || '').trim();
      const lng = String(form.lng || '').trim();
      if (lat && lng) body.latLng = [Number(lat), Number(lng)];
      if (editing) await apiFetch(`/colleges/${editing}`, { method: 'PUT', body: JSON.stringify(body) });
      else await apiFetch('/colleges', { method: 'POST', body: JSON.stringify(body) });
      flash('good', editing ? 'College updated.' : `${body.name} is live in the picker.`);
      setForm(EMPTY_COLLEGE);
      setEditing(null);
      load();
    } catch (e) { flash('bad', e.message); }
    finally { setBusy(''); }
  };

  const toggleActive = async (c) => {
    setBusy(`act-${c.code}`);
    try {
      await apiFetch(`/colleges/${c.code}`, { method: 'PUT', body: JSON.stringify({ active: !c.active }) });
      flash('good', c.active ? `${c.name} hidden from signups.` : `${c.name} is live again.`);
      load();
    } catch (e) { flash('bad', e.message); }
    finally { setBusy(''); }
  };

  const removeCollege = async (c) => {
    if (!window.confirm(`Delete ${c.name}? Only possible if nobody has signed up through it.`)) return;
    setBusy(`del-${c.code}`);
    try {
      await apiFetch(`/colleges/${c.code}`, { method: 'DELETE' });
      flash('good', 'College deleted.');
      load();
    } catch (e) { flash('bad', e.message); }
    finally { setBusy(''); }
  };

  const approve = async (g, reqId) => {
    setBusy(`ap-${g.collegeName}`);
    try {
      // The domain comes from what the requester submitted. VERIFY IT against
      // the college's official website before pressing this — a request is not
      // evidence, and adding a wrong domain locks out a whole campus.
      const hint = g.domains[0] || '';
      const suggestedCode = g.collegeName.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 20);
      const code = window.prompt(
        `Add "${g.collegeName}".\n\nVerify the domain on the college's OFFICIAL website first.\n\nCode (edit if needed):`,
        suggestedCode,
      );
      if (!code) return;
      if (!window.confirm(`Use @${hint} for ${g.collegeName}?`)) return;
      await apiFetch(`/college-requests/${reqId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ code: code.trim().toLowerCase(), domains: [hint] }),
      });
      flash('good', `${g.collegeName} added. Press Notify to tell the ${g.count} who asked.`);
      load();
    } catch (e) { flash('bad', e.message); }
    finally { setBusy(''); }
  };

  const notify = async (g, reqId) => {
    if (!window.confirm(`Email all ${g.count} people who requested ${g.collegeName}? Check the spelling is right — this is the only email they get.`)) return;
    setBusy(`no-${g.collegeName}`);
    try {
      const res = await apiFetch(`/college-requests/${reqId}/notify`, { method: 'POST' });
      flash('good', `Notified ${res.sent} of ${res.total}.`);
      load();
    } catch (e) { flash('bad', e.message); }
    finally { setBusy(''); }
  };

  const reject = async (g, reqId) => {
    if (!window.confirm(`Reject the request from ${g.collegeName}? They won't be emailed.`)) return;
    setBusy(`rj-${g.collegeName}`);
    try {
      await apiFetch(`/college-requests/${reqId}/reject`, { method: 'POST' });
      flash('good', 'Rejected.');
      load();
    } catch (e) { flash('bad', e.message); }
    finally { setBusy(''); }
  };

  const visible = showOld ? requests : requests.filter((g) => g.ageDays < 30);
  const pending = requests.filter((g) => g.status === 'pending').length;
  const oldCount = requests.filter((g) => g.status === 'pending' && g.ageDays >= 30).length;

  // ⚠️ This used to read `{ ...input, marginBottom: 12 }`, spreading an `input`
  // that is never declared in this scope. Every one of the six text fields
  // below was styled from it, so the whole Colleges tab threw
  // "ReferenceError: Can't find variable: input" on its first render and the
  // error boundary took the page down with it.
  //
  // The base style is written out rather than derived, so there is nothing left
  // to be undefined. `inputStyle` is just that base plus the spacing this form
  // wants — it was always only ever those two things.
  const inputStyle = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: T.fontBody,
    fontSize: 14,
    fontWeight: 500,
    color: T.ink,
    backgroundColor: T.hair,
    border: `2px solid ${T.ink}`,
    borderRadius: 10,
    padding: '10px 12px',
    outline: 'none',
    marginBottom: 12,
  };

  // Fields laid out inside a flex row manage their own width and must not also
  // carry the block-level margin, or they sit visually misaligned with the
  // stacked fields above them.
  const inputStyleInline = { ...inputStyle, flex: 1, marginBottom: 0 };

  return (
    <div>
      <PageHeader title="Colleges" subtitle={`${colleges.length} listed · ${pending} campus${pending === 1 ? '' : 'es'} requested`} />

      {msg && (
        <div style={{ ...pillBtn(msg.tone === 'good' ? 'primary' : 'danger'), marginBottom: 14, display: 'inline-block' }}>
          {msg.text}
        </div>
      )}

      {/* ── ADD / EDIT ── */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <h4 style={{ fontFamily: T.fontHeavy, fontSize: 14, fontWeight: 400, color: T.ink, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.02em' }}>
          {editing ? `Edit ${editing}` : 'Add a college'}
        </h4>
        <p style={{ ...label, margin: '0 0 16px', textTransform: 'none', letterSpacing: '.04em' }}>
          Verify the domain on the college's official website. A college with no domain would let anyone in.
        </p>

        <form onSubmit={submitCollege}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={label}>Code</label>
              <input style={inputStyle} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="iitd" disabled={Boolean(editing)} required />
              {editing && <p style={{ ...label, margin: '-8px 0 12px', textTransform: 'none' }}>Permanent once students exist</p>}
            </div>
            <div style={{ flex: '3 1 260px' }}>
              <label style={label}>Full official name</label>
              <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Indian Institute of Technology Delhi" required />
            </div>
          </div>

          <label style={label}>Email domains (at least one)</label>
          {form.domains.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={inputStyleInline} value={d} onChange={(e) => setDomainAt(i, e.target.value)}
                placeholder="iitd.ac.in" />
              {form.domains.length > 1 && (
                <button type="button" className="adm-slam" onClick={() => setForm((f) => ({ ...f, domains: f.domains.filter((_, x) => x !== i) }))}
                  style={{ ...pillBtn('danger'), padding: '0 12px' }} aria-label="Remove domain"><X size={14} /></button>
              )}
            </div>
          ))}
          <button type="button" className="adm-slam" onClick={() => setForm((f) => ({ ...f, domains: [...f.domains, ''] }))}
            style={{ ...pillBtn(), marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> Add domain
          </button>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input style={inputStyleInline} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" />
            <input style={inputStyleInline} value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} placeholder="State" />
            <input style={inputStyleInline} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="Country" />
          </div>

          {/* 📍 Campus map position. Optional — a college without one is fully
              functional, its students simply have no distance band and rank by
              intent and quality instead. Two boxes rather than one "lat,lng"
              string because an operator transcribing coordinates will catch a
              transposed pair far more easily in separate fields. */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ ...inputStyle, flex: '0 1 150px', marginBottom: 0 }}
              value={form.lat}
              onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
              placeholder="Latitude (19.076)"
              inputMode="decimal"
            />
            <input
              style={{ ...inputStyle, flex: '0 1 150px', marginBottom: 0 }}
              value={form.lng}
              onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
              placeholder="Longitude (72.878)"
              inputMode="decimal"
            />
            <span style={{ fontSize: 11, opacity: 0.6, flex: '1 1 100%', lineHeight: 1.5 }}>
              Used only to rank people nearby. Leave both blank to skip — students
              of this college will still appear, just without a distance label.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" className="adm-slam" disabled={busy === 'save'}
              style={{ ...pillBtn('primary'), padding: '13px 28px', fontSize: 11 }}>
              {busy === 'save' ? 'Saving…' : editing ? 'Save changes' : 'Add college'}
            </button>
            {editing && (
              <button type="button" className="adm-slam" onClick={() => { setEditing(null); setForm(EMPTY_COLLEGE); }}
                style={{ ...pillBtn(), padding: '13px 20px', fontSize: 11 }}>Cancel</button>
            )}
          </div>
        </form>
      </Card>

      {/* ── REQUESTED CAMPUSES ── */}
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h4 style={{ fontFamily: T.fontHeavy, fontSize: 14, fontWeight: 400, color: T.ink, margin: 0, textTransform: 'uppercase', letterSpacing: '.02em' }}>
            Requested campuses
          </h4>
          {oldCount > 0 && (
            <button className="adm-slam" onClick={() => setShowOld((s) => !s)}
              style={{ ...pillBtn(showOld ? 'primary' : 'warn'), padding: '6px 12px', fontSize: 10 }}>
              {showOld ? 'Hide old' : `${oldCount} waiting 30d+`}
            </button>
          )}
        </div>
        <p style={{ ...label, margin: '0 0 16px', textTransform: 'none', letterSpacing: '.04em' }}>
          Most requests first — that order is your priority list.
        </p>

        {visible.length === 0 ? (
          <p style={{ ...label, textTransform: 'none', letterSpacing: '.04em' }}>Nothing waiting.</p>
        ) : visible.map((g) => {
          const reqId = g.requesters[0]?._id;
          return (
            <div key={g.collegeName} style={{ border: `2px solid ${T.ink}`, borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: T.card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: T.fontHeavy, fontSize: 14, color: T.ink }}>{g.collegeName}</span>
                    <span style={{ ...pillBtn('primary'), padding: '3px 9px', fontSize: 10 }}>{g.count}</span>
                    {g.ageDays >= 30 && <span style={{ ...pillBtn('warn'), padding: '3px 9px', fontSize: 9.5 }}>{g.ageDays}d old</span>}
                    {g.status === 'approved' && <span style={{ ...pillBtn('primary'), padding: '3px 9px', fontSize: 9.5 }}>added</span>}
                  </div>
                  <p style={{ ...label, margin: '6px 0 0', textTransform: 'none', letterSpacing: '.04em' }}>
                    {[g.city, g.state, g.country].filter(Boolean).join(', ') || 'No location given'}
                  </p>
                  {g.domains.length > 0 && (
                    <p style={{ ...label, margin: '4px 0 0', textTransform: 'none', letterSpacing: '.04em', color: T.ink2 }}>
                      Submitted as @{g.domains.join(' / @')}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {g.status !== 'approved' && (
                    <button className="adm-slam" onClick={() => approve(g, reqId)} disabled={busy === `ap-${g.collegeName}`}
                      style={{ ...pillBtn('primary'), padding: '9px 14px', fontSize: 10.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Plus size={13} /> Add
                    </button>
                  )}
                  {g.status === 'approved' && (
                    <button className="adm-slam" onClick={() => notify(g, reqId)} disabled={busy === `no-${g.collegeName}`}
                      style={{ ...pillBtn('primary'), padding: '9px 14px', fontSize: 10.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Send size={13} /> Notify
                    </button>
                  )}
                  {g.status === 'pending' && (
                    <button className="adm-slam" onClick={() => reject(g, reqId)} disabled={busy === `rj-${g.collegeName}`}
                      style={{ ...pillBtn(), padding: '9px 14px', fontSize: 10.5 }}>Reject</button>
                  )}
                </div>
              </div>

              {g.requesters.length > 0 && (
                <p style={{ ...label, margin: '10px 0 0', textTransform: 'none', letterSpacing: '.04em' }}>
                  {g.requesters.map((r) => r.email).join(', ')}
                </p>
              )}
            </div>
          );
        })}
      </Card>

      {/* ── LISTED COLLEGES ── */}
      <Card style={{ padding: 20 }}>
        <h4 style={{ fontFamily: T.fontHeavy, fontSize: 14, fontWeight: 400, color: T.ink, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '.02em' }}>
          Listed colleges
        </h4>
        {colleges.map((c) => (
          <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.hair}`, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: T.fontBody, fontSize: 13.5, fontWeight: 700, color: T.ink }}>{c.name}</span>
                {!c.active && <span style={{ ...pillBtn('warn'), padding: '3px 8px', fontSize: 9.5 }}>hidden</span>}
              </div>
              <p style={{ ...label, margin: '4px 0 0', textTransform: 'none', letterSpacing: '.04em' }}>
                {c.code} · @{c.domains.join(' / @')} ·{' '}
                <span style={{ color: c.studentCount > 0 ? T.coral : T.ink3 }}>
                  {c.studentCount} student{c.studentCount === 1 ? '' : 's'}
                </span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button className="adm-slam" onClick={() => { setEditing(c.code); setForm({ code: c.code, name: c.name, domains: [...c.domains], city: c.city, state: c.state, country: c.country, lat: Array.isArray(c.latLng) ? String(c.latLng[0]) : '', lng: Array.isArray(c.latLng) ? String(c.latLng[1]) : '' }); window.scrollTo(0, 0); }}
                style={{ ...pillBtn(), padding: '8px 13px', fontSize: 10.5 }}>Edit</button>
              <button className="adm-slam" onClick={() => toggleActive(c)} disabled={busy === `act-${c.code}`}
                style={{ ...pillBtn(), padding: '8px 13px', fontSize: 10.5 }}>{c.active ? 'Hide' : 'Show'}</button>
              <button className="adm-slam" onClick={() => removeCollege(c)} disabled={c.studentCount > 0} title={c.studentCount > 0 ? 'Students exist — hide it instead' : 'Delete'}
                style={{ ...pillBtn('danger'), padding: '8px 13px', fontSize: 10.5, opacity: c.studentCount > 0 ? 0.3 : 1, cursor: c.studentCount > 0 ? 'not-allowed' : 'pointer' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─── MAIN ADMIN PAGE ─── */
export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    apiFetch('/stats').then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: T.desk }}><p style={{ fontFamily: T.fontMono, color: T.ink3, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }}>Checking admin access…</p></div>;
  if (authed === false) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: T.desk, gap: 12, padding: 20, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: T.red, border: `2px solid ${T.ink}`, boxShadow: `4px 4px 0 ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={24} strokeWidth={2.4} color="#fff" />
      </div>
      <p style={{ fontFamily: T.fontHeavy, color: T.paper, fontSize: 20, fontWeight: 400, margin: 0, letterSpacing: '-.01em', textTransform: 'uppercase' }}>Access Denied</p>
      <p style={{ fontFamily: T.fontBody, color: T.ink3, fontSize: 13.5, fontWeight: 500, margin: 0 }}>Only the admin can access this page.</p>
    </div>
  );

  const tabConfig = {
    overview: { label: 'Overview', Icon: LayoutDashboard },
    reports: { label: 'Reports', Icon: AlertTriangle },
    users: { label: 'Users', Icon: Users },
    colleges: { label: 'Colleges', Icon: GraduationCap },
    analytics: { label: 'Analytics', Icon: BarChart3 },
    settings: { label: 'Settings', Icon: Settings },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: T.desk }}>
      <aside style={{ width: 240, backgroundColor: T.paper, border: `2px solid ${T.ink}`, borderRadius: 20, margin: 16, boxShadow: `6px 6px 0 ${T.ink}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: 16, height: 'calc(100vh - 32px)', flexShrink: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ padding: '22px 18px 18px', borderBottom: `2px solid ${T.ink}` }}>
          <h1 style={{ fontFamily: T.fontHeavy, fontSize: 19, fontWeight: 400, color: T.ink, margin: 0, letterSpacing: '-.01em', lineHeight: 1, textTransform: 'uppercase' }}>matchalize</h1>
          <p style={{ ...label, marginTop: 8, color: T.ink2 }}>Admin Panel</p>
        </div>
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TABS.map(tb => {
            const active = tab === tb;
            const { Icon } = tabConfig[tb];
            return (
              <button key={tb} onClick={() => setTab(tb)}
                className="adm-slam"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 12, border: `2px solid ${active ? T.ink : 'transparent'}`, cursor: 'pointer', fontSize: 12.5, fontWeight: active ? 700 : 600, textAlign: 'left', backgroundColor: active ? T.yellow : 'transparent', boxShadow: active ? `3px 3px 0 ${T.ink}` : 'none', color: T.ink, fontFamily: T.fontBody, width: '100%' }}>
                <Icon size={17} strokeWidth={active ? 2.6 : 2.2} color={active ? T.ink : T.ink3} />
                {tabConfig[tb].label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 16, borderTop: `2px solid ${T.ink}`, textAlign: 'center' }}>
          <p style={{ fontFamily: T.fontMono, fontSize: 9.5, fontWeight: 700, color: T.ink3, margin: 0, letterSpacing: '.1em' }}>v1.0.0</p>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '24px 32px', maxWidth: 1200, overflowY: 'auto', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            {tab === 'overview' && <OverviewTab />}
            {tab === 'reports' && <ReportsTab />}
            {tab === 'users' && <UsersTab />}
            {tab === 'colleges' && <CollegesTab />}
            {tab === 'analytics' && <AnalyticsTab />}
            {tab === 'settings' && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`
        .adm-input:focus, textarea:focus, select:focus { box-shadow: 3px 3px 0 #191919; }
        ::selection { background: #FFD43D; color: #191919; }
        .adm-slam { font-family: ${T.fontMono}; }
        button[class*="adm-slam"] { font-family: ${T.fontMono}; font-size: 10.5px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; }
      `}</style>
    </div>
  );
}
```

