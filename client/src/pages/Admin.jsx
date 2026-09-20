import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, AlertTriangle, Users, BarChart3, Settings,
  Search, ChevronLeft, ChevronRight, RefreshCw,
  Ban, EyeOff, X, Clock
} from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const T = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  gold: '#c4952a',
  goldDeep: '#8b6914',
  success: '#2e7d32',
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  fontBody: "'Inter', -apple-system, sans-serif",
};

const label = { fontFamily: T.fontBody, fontSize: 9.5, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.inkMuted };

const API = '/api/admin';
const TABS = ['overview', 'reports', 'users', 'analytics', 'settings'];

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
    <div style={{ backgroundColor: T.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 18, boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)', ...style }} {...props}>
      {children}
    </div>
  );
}

function Badge({ children, color = T.inkMuted, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: 999,
      backgroundColor: `${color}14`, color,
      border: `1px solid ${color}30`,
      ...style,
    }}>{children}</span>
  );
}

function Skeleton({ style = {} }) {
  return <div style={{ backgroundColor: T.surfaceAlt, borderRadius: 6, ...style }} />;
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
      {subtitle && <p style={{ ...label, marginTop: 6 }}>{subtitle}</p>}
    </div>
  );
}

const pillBtn = (variant = 'quiet') => ({
  background: variant === 'danger' ? T.crimson : variant === 'active' ? T.crimson : T.surfaceAlt,
  border: variant === 'danger' || variant === 'active' ? 'none' : '1px solid rgba(212,197,169,0.7)',
  borderRadius: 999,
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: variant === 'danger' || variant === 'active' ? '#fff' : T.inkSoft,
  fontFamily: T.fontBody,
  transition: 'transform 0.15s ease-out',
});

function Pagination({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}
        style={{ ...pillBtn(), width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <span style={{ fontFamily: T.fontType, fontSize: 13, color: T.inkSoft }}>{page} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}
        style={{ ...pillBtn(), width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: T.gold,
    reviewed: T.accent,
    actioned: T.crimson,
    dismissed: T.inkMuted,
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase',
      padding: '3px 10px', borderRadius: 999,
      backgroundColor: `${c}14`, color: c, border: `1px solid ${c}30`,
    }}>{status}</span>
  );
}

// ─── OVERVIEW TAB ───
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
    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={18} strokeWidth={2} />, accent: T.accent },
    { label: 'New Today', value: stats.newToday, icon: <Users size={18} strokeWidth={2} />, accent: T.accent },
    { label: 'Active (7d)', value: stats.active7d, icon: <LayoutDashboard size={18} strokeWidth={2} />, accent: T.accent },
    { label: 'Active (30d)', value: stats.active30d, icon: <Clock size={18} strokeWidth={2} />, accent: T.accent },
    { label: 'Pending Reports', value: stats.pendingReports, icon: <AlertTriangle size={18} strokeWidth={2} />, accent: T.crimson },
    { label: 'Active Bans', value: stats.activeBans, icon: <Ban size={18} strokeWidth={2} />, accent: T.crimson },
    { label: 'Shadowbans', value: stats.activeShadowbans, icon: <EyeOff size={18} strokeWidth={2} />, accent: T.gold },
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
    return <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, color: T.inkMuted, margin: 0 }}>Failed to load stats. Check your connection and admin access.</p></Card>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader title="Overview" subtitle="Platform health at a glance" />
        <button onClick={loadStats} className="tactile-btn" style={{ ...pillBtn(), display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} strokeWidth={2} /> Refresh
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <Card style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={label}>{c.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 12, border: `1px solid ${c.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${c.accent}12`, color: c.accent }}>{c.icon}</div>
              </div>
              <p style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {(c.value ?? 0).toLocaleString()}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── REPORTS TAB ───
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
          <Search size={14} strokeWidth={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.inkMuted }} />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 38px', borderRadius: 6, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: T.paper, fontSize: 13.5, color: T.ink, outline: 'none', fontFamily: T.fontBody }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: T.paper, fontSize: 12, fontWeight: 600, color: T.ink, cursor: 'pointer', fontFamily: T.fontBody }}>
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
        <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, color: T.inkMuted, margin: 0 }}>No reports found</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {reports.map(r => (
            <Card key={r._id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: T.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {r.reported.photo ? <img src={r.reported.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Users size={16} strokeWidth={2} style={{ color: T.inkMuted }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{r.reported.name}</span>
                      <StatusBadge status={r.status} />
                      <Badge color={T.gold}>{r.reportCount} reports</Badge>
                    </div>
                    <p style={{ fontSize: 12.5, fontWeight: 450, color: T.inkSoft, margin: '3px 0 0' }}>{r.reason} — by {r.reporter.name}</p>
                    <p style={{ fontFamily: T.fontType, fontSize: 11, color: T.inkMuted, margin: '3px 0 0' }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="tactile-btn" onClick={() => setDetailReport(r)} style={pillBtn()}>View</button>
                  {r.status === 'pending' && <>
                    <button className="tactile-btn" onClick={() => updateReport(r._id, { status: 'dismissed' })} style={pillBtn()}>Dismiss</button>
                    <button className="tactile-btn" onClick={() => updateReport(r._id, { status: 'actioned' })} style={pillBtn('danger')}>Action</button>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setDetailReport(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(28,19,10,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ background: T.paper, borderRadius: 18, border: '1px solid rgba(212,197,169,0.7)', boxShadow: '0 24px 64px rgba(12,7,2,0.4)', maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: 24, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>Report Detail</h3>
                <button className="tactile-btn" onClick={() => setDetailReport(null)} aria-label="Close" style={{ backgroundColor: T.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink, flexShrink: 0 }}><X size={16} strokeWidth={2} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ backgroundColor: T.surfaceAlt, borderRadius: 6, border: '1px solid rgba(212,197,169,0.5)', padding: 12 }}>
                  <p style={label}>Reporter</p>
                  <p style={{ fontWeight: 600, fontSize: 14, color: T.ink, margin: '6px 0 0' }}>{detailReport.reporter.name}</p>
                  <p style={{ fontFamily: T.fontType, fontSize: 11.5, color: T.inkMuted, margin: '2px 0 0' }}>{detailReport.reporter.email}</p>
                </div>
                <div style={{ backgroundColor: T.surfaceAlt, borderRadius: 6, border: '1px solid rgba(212,197,169,0.5)', padding: 12 }}>
                  <p style={label}>Reported</p>
                  <p style={{ fontWeight: 600, fontSize: 14, color: T.ink, margin: '6px 0 0' }}>{detailReport.reported.name}</p>
                  <p style={{ fontFamily: T.fontType, fontSize: 11.5, color: T.inkMuted, margin: '2px 0 0' }}>{detailReport.reported.email}</p>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...label, marginBottom: 8 }}>Reason</p>
                <Badge color={T.accent}>{detailReport.reason}</Badge>
              </div>
              {detailReport.details && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ ...label, marginBottom: 8 }}>Details</p>
                  <p style={{ fontFamily: T.fontType, fontSize: 13, color: T.ink, backgroundColor: T.surfaceAlt, padding: 12, borderRadius: 6, border: '1px solid rgba(212,197,169,0.5)', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>{detailReport.details}</p>
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <p style={{ ...label, marginBottom: 8 }}>Total Reports Against This User</p>
                <p style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 800, color: T.crimson, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{detailReport.reportCount}</p>
              </div>
              {detailReport.status === 'pending' && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="tactile-btn" onClick={() => updateReport(detailReport._id, { status: 'dismissed' })} style={{ ...pillBtn(), flex: 1 }}>Dismiss</button>
                  <button className="tactile-btn" onClick={() => updateReport(detailReport._id, { status: 'actioned' })} style={{ ...pillBtn('danger'), flex: 1 }}>Action</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── USERS TAB ───
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
    if (u.isGhost) return 'Shadowbanned';
    return 'Active';
  };

  const statusColor = (s) => {
    if (s === 'Suspended') return T.crimson;
    if (s === 'Shadowbanned') return T.gold;
    return T.success;
  };

  return (
    <div>
      <PageHeader title="Users" subtitle={`${pagination.total} total users`} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} strokeWidth={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.inkMuted }} />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 38px', borderRadius: 6, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: T.paper, fontSize: 13.5, color: T.ink, outline: 'none', fontFamily: T.fontBody }} />
        </div>
        {['all', 'active', 'shadowbanned', 'suspended'].map(s => (
          <button key={s} className="tactile-btn" onClick={() => setStatusFilter(s)}
            style={{ ...pillBtn(statusFilter === s ? 'active' : 'quiet'), color: statusFilter === s ? '#fff' : T.inkSoft, textTransform: 'capitalize', letterSpacing: '0.5px' }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>{Array.from({ length: 5 }).map((_, i) => <Card key={i} style={{ padding: 16 }}><Skeleton style={{ height: 14, width: '50%', marginBottom: 10 }} /><Skeleton style={{ height: 12, width: '30%' }} /></Card>)}</div>
      ) : users.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, color: T.inkMuted, margin: 0 }}>No users found</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {users.map(u => {
            const status = userStatus(u);
            return (
              <Card key={u._id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: T.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {u.photos?.[0] ? <img src={u.photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ fontWeight: 700, color: T.inkMuted, fontSize: 16 }}>{u.name?.[0]}</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{u.name}</span>
                        <Badge color={statusColor(status)}>{status}</Badge>
                      </div>
                      <p style={{ fontSize: 12.5, fontWeight: 450, color: T.inkSoft, margin: '3px 0 0' }}>{u.email} · {u.branch} · {u.year}</p>
                      <p style={{ fontFamily: T.fontType, fontSize: 11, color: T.inkMuted, margin: '3px 0 0' }}>Reports: {u.reportStats?.count || 0} · Last active: {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Never'}</p>
                    </div>
                  </div>
                  <button className="tactile-btn" onClick={() => setDetailUser(u)} style={{ ...pillBtn(), flexShrink: 0 }}>Manage</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={p => load(p)} />

      <AnimatePresence>
        {detailUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setDetailUser(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(28,19,10,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ background: T.paper, borderRadius: 18, border: '1px solid rgba(212,197,169,0.7)', boxShadow: '0 24px 64px rgba(12,7,2,0.4)', maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: 24, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>{detailUser.name}</h3>
                <button className="tactile-btn" onClick={() => setDetailUser(null)} aria-label="Close" style={{ backgroundColor: T.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink, flexShrink: 0 }}><X size={16} strokeWidth={2} /></button>
              </div>
              <div style={{ backgroundColor: T.surfaceAlt, borderRadius: 6, border: '1px solid rgba(212,197,169,0.5)', padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Email', detailUser.email],
                  ['College', `${detailUser.college} · ${detailUser.branch} · ${detailUser.year}`],
                  ['Joined', new Date(detailUser.createdAt).toLocaleDateString()],
                  ['Last Active', detailUser.lastActive ? new Date(detailUser.lastActive).toLocaleString() : 'Never'],
                  ['Reports', `${detailUser.reportStats?.count || 0} total, ${detailUser.reportStats?.pendingCount || 0} pending`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span style={label}>{k}</span>
                    <p style={{ fontFamily: T.fontType, fontSize: 13, color: T.ink, margin: '3px 0 0', wordBreak: 'break-word' }}>{v}</p>
                  </div>
                ))}
                {detailUser.suspendedReason && (
                  <div>
                    <span style={{ ...label, color: T.crimson }}>Suspension Reason</span>
                    <p style={{ fontFamily: T.fontType, fontSize: 13, color: T.crimson, margin: '3px 0 0' }}>{detailUser.suspendedReason}</p>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...label, marginBottom: 8 }}>Admin Notes</p>
                <textarea value={detailUser.adminNotes || ''} onChange={e => setDetailUser({ ...detailUser, adminNotes: e.target.value })}
                  placeholder="Internal notes..."
                  style={{ width: '100%', boxSizing: 'border-box', minHeight: 60, padding: 10, borderRadius: 6, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: T.surfaceAlt, fontSize: 13, color: T.ink, resize: 'vertical', fontFamily: T.fontBody, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button className="tactile-btn" onClick={() => updateUser(detailUser._id, { suspended: !detailUser.suspended, suspendedReason: !detailUser.suspended ? 'Admin action' : '' })}
                  style={{ ...pillBtn(detailUser.suspended ? 'quiet' : 'danger'), padding: '12px 8px' }}>
                  {detailUser.suspended ? 'Unsuspend' : 'Suspend'}
                </button>
                <button className="tactile-btn" onClick={() => updateUser(detailUser._id, { isGhost: !detailUser.isGhost })}
                  style={{ ...pillBtn('quiet'), padding: '12px 8px', color: detailUser.isGhost ? T.inkSoft : T.gold, borderColor: detailUser.isGhost ? 'rgba(212,197,169,0.7)' : `${T.gold}55` }}>
                  {detailUser.isGhost ? 'Unshadowban' : 'Shadowban'}
                </button>
                <button className="tactile-btn" onClick={() => updateUser(detailUser._id, { adminNotes: detailUser.adminNotes })}
                  style={{ ...pillBtn('quiet'), padding: '12px 8px' }}>
                  Save Notes
                </button>
                <button className="tactile-btn" onClick={async () => { try { await apiFetch(`/users/${detailUser._id}/disconnect`, { method: 'POST' }); alert('Disconnect signal sent'); } catch (e) { alert('Failed: ' + e.message); } }}
                  style={{ ...pillBtn('quiet'), padding: '12px 8px', color: T.crimson, borderColor: `${T.crimson}45` }}>
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

// ─── ANALYTICS TAB ───
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
              <span style={{ fontFamily: T.fontType, fontSize: 8, color: T.inkMuted, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{item.date?.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  if (loading) return <div style={{ display: 'grid', gap: 16 }}>{Array.from({ length: 4 }).map((_, i) => <Card key={i} style={{ padding: 20, height: 180 }}><Skeleton style={{ height: '100%', width: '100%' }} /></Card>)}</div>;
  if (!data) return <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontFamily: T.fontBody, fontSize: 13.5, color: T.inkMuted, margin: 0 }}>Failed to load analytics</p></Card>;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Last 30 days" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Chart title="Daily Signups" items={data.dailySignups} color={T.success} />
        <Chart title="Active Users" items={data.dailyActive} color={T.accent} />
        <Chart title="Reports" items={data.dailyReports} color={T.crimson} />
        <Chart title="Matches" items={data.dailyMatches} color={T.gold} />
        <Chart title="Messages" items={data.dailyMessages} color={T.goldDeep} />
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ───
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
          <h4 style={{ fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 800, color: T.ink, margin: '0 0 16px', letterSpacing: '-0.01em' }}>{group.group}</h4>
          {group.items.map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={label}>{f.label}</label>
              {f.type === 'bool'
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <button onClick={() => set(f.key, !settings[f.key])} style={{ width: 44, height: 24, borderRadius: 999, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: settings[f.key] ? T.crimson : T.surfaceAlt, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 2, left: settings[f.key] ? 23 : 2, transition: 'left 0.2s cubic-bezier(0.22, 1, 0.36, 1)', boxShadow: '0 2px 6px rgba(88,63,30,0.25)' }} />
                    </button>
                    <span style={{ fontFamily: T.fontType, fontSize: 11.5, color: T.inkMuted }}>{settings[f.key] ? 'Enabled' : 'Disabled'}</span>
                  </div>
                : <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={settings[f.key] ?? ''}
                    onChange={e => set(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    style={{ width: '100%', maxWidth: 300, padding: '9px 12px', borderRadius: 6, border: '1px solid rgba(212,197,169,0.7)', backgroundColor: T.paper, fontSize: 13.5, color: T.ink, fontFamily: T.fontBody, outline: 'none', marginTop: 8 }}
                  />
              }
            </div>
          ))}
        </Card>
      ))}
      <button className="tactile-btn" onClick={save} disabled={!hasChanges}
        style={{ ...pillBtn('danger'), padding: '13px 28px', fontSize: 11, opacity: hasChanges ? 1 : 0.4, cursor: hasChanges ? 'pointer' : 'not-allowed' }}>
        {saved ? 'Saved' : 'Save Settings'}
      </button>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ───
export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    apiFetch('/stats').then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: T.desk }}><p style={{ fontFamily: T.fontType, color: T.inkMuted, fontSize: 13 }}>Checking admin access...</p></div>;
  if (authed === false) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: T.desk, gap: 12, padding: 20, textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: T.surfaceAlt, border: '1px solid rgba(212,197,169,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={18} strokeWidth={2} color={T.crimson} />
      </div>
      <p style={{ fontFamily: T.fontDisplay, color: T.ink, fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Access Denied</p>
      <p style={{ fontFamily: T.fontBody, color: T.inkMuted, fontSize: 13.5, margin: 0 }}>Only the admin can access this page.</p>
    </div>
  );

  const tabConfig = {
    overview: { label: 'Overview', Icon: LayoutDashboard },
    reports: { label: 'Reports', Icon: AlertTriangle },
    users: { label: 'Users', Icon: Users },
    analytics: { label: 'Analytics', Icon: BarChart3 },
    settings: { label: 'Settings', Icon: Settings },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: T.desk }}>
      <aside style={{ width: 240, backgroundColor: T.paper, border: '1px solid rgba(212,197,169,0.7)', borderRadius: 18, boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 16, height: 'calc(100vh - 32px)', margin: 16, flexShrink: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(212,197,169,0.7)' }}>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 900, color: T.ink, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>matchalize</h1>
          <p style={{ ...label, marginTop: 8 }}>Admin Panel</p>
        </div>
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TABS.map(tb => {
            const active = tab === tb;
            const { Icon } = tabConfig[tb];
            return (
              <button key={tb} onClick={() => setTab(tb)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 12, border: active ? '1px solid rgba(212,197,169,0.9)' : '1px solid transparent', cursor: 'pointer', fontSize: 13.5, fontWeight: active ? 700 : 500, textAlign: 'left', backgroundColor: active ? T.card : 'transparent', boxShadow: active ? '0 6px 16px rgba(88,63,30,0.12)' : 'none', color: T.ink, fontFamily: T.fontBody, width: '100%' }}>
                <Icon size={17} strokeWidth={active ? 2.5 : 2} color={active ? T.crimson : T.inkMuted} />
                {tabConfig[tb].label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid rgba(212,197,169,0.7)', textAlign: 'center' }}>
          <p style={{ fontFamily: T.fontType, fontSize: 10.5, color: T.inkMuted, margin: 0 }}>v1.0.0</p>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '24px 32px', maxWidth: 1200, overflowY: 'auto', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            {tab === 'overview' && <OverviewTab />}
            {tab === 'reports' && <ReportsTab />}
            {tab === 'users' && <UsersTab />}
            {tab === 'analytics' && <AnalyticsTab />}
            {tab === 'settings' && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      <style>{`
        .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
        .tactile-btn:active { transform: scale(0.96) !important; }
        input:focus, textarea:focus, select:focus { border-color: rgba(139,69,19,0.45) !important; }
        ::selection { background: rgba(139,26,26,0.15); }
      `}</style>
    </div>
  );
}