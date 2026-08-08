import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, AlertTriangle, Users, BarChart3, Settings,
  Search, ChevronLeft, ChevronRight, RefreshCw,
  Ban, EyeOff, X, Clock
} from 'lucide-react';

const T = {
  paper: '#fdfbf7',
  surface: '#f5f0e8',
  surfaceAlt: '#ede7db',
  surfaceDim: '#e0d8c8',
  border: '#d4c9b5',
  borderDark: '#b8a98e',
  ink: '#2c2416',
  inkSoft: '#5c4f3d',
  inkMuted: '#8a7e6e',
  crimson: '#8b1a1a',
  crimsonLight: '#b8333a',
  success: '#2d6a4f',
  warning: '#b8860b',
  danger: '#8b1a1a',
  amber: '#c4952a',
  shadow: '0 1px 3px rgba(44,36,22,0.08)',
  shadowMd: '0 4px 12px rgba(44,36,22,0.12)',
  fontDisplay: "'Playfair Display', serif",
  fontMono: "'Special Elite', cursive",
  fontBody: "'Inter', sans-serif",
};

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
    <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow, ...style }} {...props}>
      {children}
    </div>
  );
}

function Badge({ children, color = T.inkMuted, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      backgroundColor: `${color}15`, color,
      ...style,
    }}>{children}</span>
  );
}

function Skeleton({ style = {} }) {
  return <div style={{ backgroundColor: T.surfaceDim, borderRadius: 6, ...style }} />;
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 700, color: T.ink, margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 14, color: T.inkMuted, marginTop: 4, margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
        <ChevronLeft size={16} />
      </button>
      <span style={{ fontSize: 13, color: T.inkSoft, fontFamily: T.fontMono }}>{page} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    reviewed: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
    actioned: { bg: '#fce4ec', text: '#991b1b', border: '#ef4444' },
    dismissed: { bg: T.surfaceAlt, text: T.inkMuted, border: T.border },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
      backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}40`,
      textTransform: 'capitalize',
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
    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={20} />, accent: T.success },
    { label: 'New Today', value: stats.newToday, icon: <Users size={20} />, accent: T.success },
    { label: 'Active (7d)', value: stats.active7d, icon: <LayoutDashboard size={20} />, accent: T.success },
    { label: 'Active (30d)', value: stats.active30d, icon: <Clock size={20} />, accent: T.success },
    { label: 'Pending Reports', value: stats.pendingReports, icon: <AlertTriangle size={20} />, accent: T.crimson },
    { label: 'Active Bans', value: stats.activeBans, icon: <Ban size={20} />, accent: T.crimson },
    { label: 'Shadowbans', value: stats.activeShadowbans, icon: <EyeOff size={20} />, accent: T.amber },
  ] : [];

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <Skeleton style={{ height: 20, width: 100, marginBottom: 12 }} />
            <Skeleton style={{ height: 32, width: 80 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ color: T.inkMuted }}>Failed to load stats. Check your connection and admin access.</p></Card>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader title="Overview" subtitle="Platform health at a glance" />
        <button onClick={loadStats} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: T.inkSoft, fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card style={{ padding: 20, borderLeft: `3px solid ${c.accent}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: T.inkSoft, fontWeight: 500 }}>{c.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${c.accent}15`, color: c.accent }}>{c.icon}</div>
              </div>
              <p style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, color: T.ink, margin: 0 }}>
                {(c.value ?? 0).toLocaleString()
                }
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
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.inkMuted }} />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.paper, fontSize: 14, color: T.ink, outline: 'none', fontFamily: T.fontBody }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.paper, fontSize: 13, color: T.ink, cursor: 'pointer' }}>
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
              <Skeleton style={{ height: 16, width: '60%', marginBottom: 8 }} />
              <Skeleton style={{ height: 14, width: '40%' }} />
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ color: T.inkMuted }}>No reports found</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {reports.map(r => (
            <Card key={r._id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: T.surfaceDim, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {r.reported.photo ? <img src={r.reported.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Users size={18} style={{ color: T.inkMuted }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{r.reported.name}</span>
                      <StatusBadge status={r.status} />
                      <Badge color={T.amber}>{r.reportCount} reports</Badge>
                    </div>
                    <p style={{ fontSize: 12, color: T.inkMuted, margin: '2px 0 0' }}>{r.reason} — by {r.reporter.name}</p>
                    <p style={{ fontSize: 11, color: T.inkMuted, margin: '2px 0 0', fontFamily: T.fontMono }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setDetailReport(r)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.paper, cursor: 'pointer', fontSize: 12, color: T.inkSoft }}>View</button>
                  {r.status === 'pending' && <>
                    <button onClick={() => updateReport(r._id, { status: 'dismissed' })} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.paper, cursor: 'pointer', fontSize: 12, color: T.inkMuted }}>Dismiss</button>
                    <button onClick={() => updateReport(r._id, { status: 'actioned' })} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: T.crimson, color: '#fff', cursor: 'pointer', fontSize: 12 }}>Action</button>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDetailReport(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: T.paper, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadowMd, maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700, color: T.ink, margin: 0 }}>Report Detail</h3>
                <button onClick={() => setDetailReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.inkMuted }}><X size={20} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <Card style={{ padding: 12 }}>
                  <p style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4, margin: 0 }}>Reporter</p>
                  <p style={{ fontWeight: 600, fontSize: 14, color: T.ink, margin: '4px 0 0' }}>{detailReport.reporter.name}</p>
                  <p style={{ fontSize: 12, color: T.inkMuted, margin: '2px 0 0' }}>{detailReport.reporter.email}</p>
                </Card>
                <Card style={{ padding: 12 }}>
                  <p style={{ fontSize: 11, color: T.inkMuted, marginBottom: 4, margin: 0 }}>Reported</p>
                  <p style={{ fontWeight: 600, fontSize: 14, color: T.ink, margin: '4px 0 0' }}>{detailReport.reported.name}</p>
                  <p style={{ fontSize: 12, color: T.inkMuted, margin: '2px 0 0' }}>{detailReport.reported.email}</p>
                </Card>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 4 }}>Reason</p>
                <Badge>{detailReport.reason}</Badge>
              </div>
              {detailReport.details && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 4 }}>Details</p>
                  <p style={{ fontSize: 14, color: T.ink, backgroundColor: T.surface, padding: 12, borderRadius: 8 }}>{detailReport.details}</p>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 4 }}>Total Reports Against This User</p>
                <p style={{ fontSize: 24, fontWeight: 700, fontFamily: T.fontMono, color: T.crimson }}>{detailReport.reportCount}</p>
              </div>
              {detailReport.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => updateReport(detailReport._id, { status: 'dismissed' })} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.paper, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: T.inkSoft }}>Dismiss</button>
                  <button onClick={() => updateReport(detailReport._id, { status: 'actioned' })} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: T.crimson, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Action</button>
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
    if (s === 'Shadowbanned') return T.amber;
    return T.success;
  };

  return (
    <div>
      <PageHeader title="Users" subtitle={`${pagination.total} total users`} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.inkMuted }} />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.paper, fontSize: 14, color: T.ink, outline: 'none', fontFamily: T.fontBody }} />
        </div>
        {['all', 'active', 'shadowbanned', 'suspended'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${statusFilter === s ? T.crimson : T.border}`, background: statusFilter === s ? `${T.crimson}10` : T.paper, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: statusFilter === s ? T.crimson : T.inkSoft, textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>{Array.from({ length: 5 }).map((_, i) => <Card key={i} style={{ padding: 16 }}><Skeleton style={{ height: 16, width: '50%', marginBottom: 8 }} /><Skeleton style={{ height: 14, width: '30%' }} /></Card>)}</div>
      ) : users.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ color: T.inkMuted }}>No users found</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {users.map(u => {
            const status = userStatus(u);
            return (
              <Card key={u._id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: T.surfaceDim, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {u.photos?.[0] ? <img src={u.photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ fontWeight: 700, color: T.inkMuted, fontSize: 16 }}>{u.name?.[0]}</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{u.name}</span>
                        <Badge color={statusColor(status)}>{status}</Badge>
                      </div>
                      <p style={{ fontSize: 12, color: T.inkMuted, margin: '2px 0 0' }}>{u.email} · {u.branch} · {u.year}</p>
                      <p style={{ fontSize: 11, color: T.inkMuted, margin: '2px 0 0', fontFamily: T.fontMono }}>Reports: {u.reportStats?.count || 0} · Last active: {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Never'}</p>
                    </div>
                  </div>
                  <button onClick={() => setDetailUser(u)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.paper, cursor: 'pointer', fontSize: 12, color: T.inkSoft }}>Manage</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={p => load(p)} />

      <AnimatePresence>
        {detailUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDetailUser(null)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: T.paper, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadowMd, maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700, color: T.ink, margin: 0 }}>{detailUser.name}</h3>
                <button onClick={() => setDetailUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.inkMuted }}><X size={20} /></button>
              </div>
              <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 16, lineHeight: 1.8 }}>
                <p style={{ margin: 0 }}><strong>Email:</strong> {detailUser.email}</p>
                <p style={{ margin: 0 }}><strong>College:</strong> {detailUser.college} · {detailUser.branch} · {detailUser.year}</p>
                <p style={{ margin: 0 }}><strong>Joined:</strong> {new Date(detailUser.createdAt).toLocaleDateString()}</p>
                <p style={{ margin: 0 }}><strong>Last Active:</strong> {detailUser.lastActive ? new Date(detailUser.lastActive).toLocaleString() : 'Never'}</p>
                <p style={{ margin: 0 }}><strong>Reports:</strong> {detailUser.reportStats?.count || 0} total, {detailUser.reportStats?.pendingCount || 0} pending</p>
                {detailUser.suspendedReason && <p style={{ margin: 0, color: T.crimson }}><strong>Suspension Reason:</strong> {detailUser.suspendedReason}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 6 }}>Admin Notes</p>
                <textarea value={detailUser.adminNotes || ''} onChange={e => setDetailUser({ ...detailUser, adminNotes: e.target.value })}
                  placeholder="Internal notes..."
                  style={{ width: '100%', minHeight: 60, padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.surface, fontSize: 13, color: T.ink, resize: 'vertical', fontFamily: T.fontBody }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => updateUser(detailUser._id, { suspended: !detailUser.suspended, suspendedReason: !detailUser.suspended ? 'Admin action' : '' })}
                  style={{ padding: '10px 12px', borderRadius: 8, border: 'none', background: detailUser.suspended ? T.success : T.crimson, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                  {detailUser.suspended ? 'Unsuspend' : 'Suspend'}
                </button>
                <button onClick={() => updateUser(detailUser._id, { isGhost: !detailUser.isGhost })}
                  style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: detailUser.isGhost ? T.paper : `${T.amber}15`, color: detailUser.isGhost ? T.inkSoft : T.amber, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                  {detailUser.isGhost ? 'Unshadowban' : 'Shadowban'}
                </button>
                <button onClick={() => updateUser(detailUser._id, { adminNotes: detailUser.adminNotes })}
                  style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.paper, color: T.inkSoft, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                  Save Notes
                </button>
                <button onClick={async () => { try { await apiFetch(`/users/${detailUser._id}/disconnect`, { method: 'POST' }); alert('Disconnect signal sent'); } catch (e) { alert('Failed: ' + e.message); } }}
                  style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.paper, color: T.danger, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
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
        <h4 style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 700, color: T.ink, margin: '0 0 16px' }}>{title}</h4>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
          {items.slice(-14).map((item, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', backgroundColor: color, borderRadius: '3px 3px 0 0', height: `${(item.count / max) * 100}%`, minHeight: 2, transition: 'height 0.3s' }} />
              <span style={{ fontSize: 8, color: T.inkMuted, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{item.date?.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  if (loading) return <div style={{ display: 'grid', gap: 16 }}>{Array.from({ length: 4 }).map((_, i) => <Card key={i} style={{ padding: 20, height: 180 }}><Skeleton style={{ height: '100%', width: '100%' }} /></Card>)}</div>;
  if (!data) return <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ color: T.inkMuted }}>Failed to load analytics</p></Card>;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Last 30 days" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Chart title="Daily Signups" items={data.dailySignups} color={T.success} />
        <Chart title="Active Users" items={data.dailyActive} color="#0d7377" />
        <Chart title="Reports" items={data.dailyReports} color={T.crimson} />
        <Chart title="Matches" items={data.dailyMatches} color={T.crimsonLight} />
        <Chart title="Messages" items={data.dailyMessages} color={T.amber} />
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

  if (loading) return <div>{Array.from({ length: 3 }).map((_, i) => <Card key={i} style={{ padding: 20, marginBottom: 12 }}><Skeleton style={{ height: 20, width: 200, marginBottom: 12 }} /><Skeleton style={{ height: 40 }} /></Card>)}</div>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform configuration" />
      {fields.map(group => (
        <Card key={group.group} style={{ padding: 20, marginBottom: 16 }}>
          <h4 style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 700, color: T.ink, margin: '0 0 16px' }}>{group.group}</h4>
          {group.items.map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: T.inkSoft, display: 'block', marginBottom: 6 }}>{f.label}</label>
              {f.type === 'bool'
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => set(f.key, !settings[f.key])} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', backgroundColor: settings[f.key] ? T.crimson : T.surfaceDim, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 2, left: settings[f.key] ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                    <span style={{ fontSize: 12, color: T.inkMuted }}>{settings[f.key] ? 'Enabled' : 'Disabled'}</span>
                  </div>
                : <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={settings[f.key] ?? ''}
                    onChange={e => set(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    style={{ width: '100%', maxWidth: 300, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, backgroundColor: T.paper, fontSize: 14, color: T.ink, fontFamily: T.fontBody }}
                  />
              }
            </div>
          ))}
        </Card>
      ))}
      <button onClick={save} disabled={!hasChanges}
        style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: hasChanges ? T.crimson : T.surfaceDim, color: '#fff', cursor: hasChanges ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 14, opacity: hasChanges ? 1 : 0.6 }}>
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

  if (authed === null) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: T.paper }}><p style={{ color: T.inkMuted, fontSize: 16 }}>Checking admin access...</p></div>;
  if (authed === false) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: T.paper, gap: 12 }}><AlertTriangle size={48} style={{ color: T.crimson }} /><p style={{ color: T.ink, fontSize: 18, fontWeight: 600, fontFamily: T.fontDisplay }}>Access Denied</p><p style={{ color: T.inkMuted, fontSize: 14 }}>Only the admin can access this page.</p></div>;

  const tabConfig = {
    overview: { label: 'Overview', icon: <LayoutDashboard size={20} /> },
    reports: { label: 'Reports', icon: <AlertTriangle size={20} /> },
    users: { label: 'Users', icon: <Users size={20} /> },
    analytics: { label: 'Analytics', icon: <BarChart3 size={20} /> },
    settings: { label: 'Settings', icon: <Settings size={20} /> },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: T.paper }}>
      <aside style={{ width: 240, backgroundColor: T.surface, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${T.border}` }}>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700, color: T.crimson, margin: 0 }}>Matchalize</h1>
          <p style={{ fontSize: 11, color: T.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 0' }}>Admin Panel</p>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map(t => {
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'left', backgroundColor: active ? 'rgba(139,26,26,0.06)' : 'transparent', color: active ? T.crimson : T.inkSoft, borderLeft: active ? `3px solid ${T.crimson}` : '3px solid transparent', width: '100%' }}>
                <span style={{ color: active ? T.crimson : T.inkMuted }}>{tabConfig[t].icon}</span>
                {tabConfig[t].label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '16px', borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: T.inkMuted, margin: 0 }}>v1.0.0</p>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '24px 32px', maxWidth: 1200, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === 'overview' && <OverviewTab />}
            {tab === 'reports' && <ReportsTab />}
            {tab === 'users' && <UsersTab />}
            {tab === 'analytics' && <AnalyticsTab />}
            {tab === 'settings' && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
